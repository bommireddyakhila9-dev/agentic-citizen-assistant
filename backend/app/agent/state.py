from typing import Annotated, Sequence, TypedDict, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    State definition for the Agentic Citizen Assistant.
    - messages: Thread history with add_messages reducer to cleanly append conversational turns.
    - citizen_phone: Verified phone number if provided during the session.
    - active_ticket: Currently discussed grievance ticket number.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    citizen_phone: Optional[str]
    active_ticket: Optional[str]
