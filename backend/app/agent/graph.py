from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
from typing import Dict, Any, List

from app.agent.state import AgentState
from app.agent.tools import (
    check_ticket_status,
    file_citizen_grievance,
    search_civic_schemes,
    lookup_citizen,
    send_citizen_alert,
)
from app.services.llm import get_gemini_llm

# List of tools available to the AI agent
TOOLS = [
    check_ticket_status,
    file_citizen_grievance,
    search_civic_schemes,
    lookup_citizen,
    send_citizen_alert,
]

# System prompt governing the agent's behavior and personality
SYSTEM_PROMPT = """You are CitizenConnect AI, an intelligent, empathetic, and efficient Agentic Citizen Assistant for municipal and public governance services.

Your primary responsibilities:
1. Grievance Tracking: When a citizen mentions or asks about a complaint ticket (e.g., GRV-1001), use the `check_ticket_status` tool to look up its latest official status, location, and any attached photo evidence.
2. Filing Complaints: When a citizen wants to report an issue (such as a pothole, broken streetlight, garbage dump, or water leakage):
   - Make sure you collect: incident details, location, and the citizen's contact phone number.
   - If an image or document was uploaded by the citizen, pass its attachment_url to `file_citizen_grievance`.
   - If they haven't provided a phone number or location, politely ask for it before filing.
   - Use the `file_citizen_grievance` tool to register the complaint and always emphasize the generated tracking ticket ID. Remind them that an automated SMS and Email confirmation has been dispatched!
3. Civic Schemes & Subsidies: When a citizen asks about public programs, subsidies, or government benefits (e.g. rooftop solar, senior citizen passes, rainwater rebate), use `search_civic_schemes` and clearly explain eligibility and required documents.
4. Profile History: If a citizen provides their phone number to check their history, use `lookup_citizen`.
5. Direct Alerts: If a citizen requests an SMS advisory or update, use `send_citizen_alert`.

Always be polite, structured, professional, and helpful. Use bullet points when explaining complex requirements. Never invent nonexistent ticket numbers or fake government policies."""


def should_continue(state: AgentState) -> str:
    """
    Determines whether the agent needs to call a tool or finish the conversation turn.
    """
    messages = state["messages"]
    last_message = messages[-1]

    # If the LLM requested a tool execution, route to 'tools'
    if getattr(last_message, "tool_calls", None):
        return "tools"
    # Otherwise, return the final response to the citizen
    return END


def call_model(state: AgentState) -> Dict[str, Any]:
    """
    Node that invokes the Gemini LLM with bound tools.
    """
    llm = get_gemini_llm()
    model_with_tools = llm.bind_tools(TOOLS)

    messages = list(state["messages"])
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    response = model_with_tools.invoke(messages)
    return {"messages": [response]}


# Build the LangGraph state machine
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(TOOLS))

# Set entry point
workflow.set_entry_point("agent")

# Add conditional edge: agent -> tools or END
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END,
    },
)

# Add edge from tools back to agent to formulate the natural language response
workflow.add_edge("tools", "agent")

# Compile the graph into an executable agent
citizen_agent = workflow.compile()


def process_citizen_query(
    user_input: str,
    conversation_history: List[Dict[str, str]] = None,
    phone: str = None,
    language: str = "English"
) -> Dict[str, Any]:
    """
    Executes the LangGraph agent for a citizen message turn with optional multilingual support.
    """
    messages: List[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]

    # Add multilingual instruction if citizen selected a language other than English
    if language and language.strip().lower() != "english":
        lang_instruction = (
            f"The citizen has selected {language} as their preferred language. "
            f"Please respond completely, naturally, and politely in {language}. "
            f"Always keep official municipal ticket numbers (e.g. GRV-1001), phone numbers, and dates intact for official records."
        )
        messages.append(SystemMessage(content=lang_instruction))

    # Reconstruct past turns if provided
    if conversation_history:
        for turn in conversation_history:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

    # Append current citizen message
    messages.append(HumanMessage(content=user_input))

    initial_state: AgentState = {
        "messages": messages,
        "citizen_phone": phone,
        "active_ticket": None,
    }

    # Execute the agent graph
    result = citizen_agent.invoke(initial_state)
    final_messages = result["messages"]

    # Extract final text output from the assistant
    last_msg = final_messages[-1]
    response_content = last_msg.content

    # Clean list or dictionary representations if returned by underlying SDK
    if isinstance(response_content, list) and len(response_content) > 0 and isinstance(response_content[0], dict):
        text_response = response_content[0].get("text", str(response_content))
    elif isinstance(response_content, list):
        text_response = " ".join(str(item) for item in response_content)
    else:
        text_response = str(response_content)

    # Collect names of tools that were executed in this turn
    tools_used = []
    for msg in final_messages:
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            for tc in tool_calls:
                tools_used.append(tc.get("name"))

    return {
        "response": text_response,
        "tools_used": list(set(tools_used)),
        "status": "success",
    }
