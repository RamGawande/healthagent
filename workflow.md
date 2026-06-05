# ===============================================================
# !pip install langgraph langchain langchain-google-genai "langchain-core>=0.1.27" tavily-python faiss-cpu

# ===============================================================
# Cell 2: Import libraries and set up API keys
# ===============================================================
import os
import uuid
from typing import TypedDict, Annotated, List

# --- Core LangChain & LangGraph Imports ---
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage, BaseMessage
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition # <-- Key new imports

# --- LLM and Tool Imports ---
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults

# --- RAG Specific Imports ---
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

# --- Colab Secret Management ---
from google.colab import userdata
os.environ["GOOGLE_API_KEY"] = userdata.get('GOOGLE_API_KEY')
os.environ["TAVILY_API_KEY"] = userdata.get('TAVILY_API_KEY')

# ===============================================================
# Cell 3: Agent Tools and RAG Setup
# ===============================================================

# --- RAG Setup for Medical Assistant Tool ---
medical_docs = [
    """What is the common cold? The common cold is a mild viral infection of the nose and throat. It's caused by over 200 different viruses, with the rhinovirus being the most common culprit. Symptoms usually include a runny or stuffy nose, sore throat, cough, congestion, and mild body aches. There is no cure for the common cold, but symptoms can be managed with rest, hydration, and over-the-counter medications.""",
    """Treating a fever: A fever is the body's natural response to infection. It's typically a symptom, not an illness itself. A normal body temperature is about 37°C (98.6°F); a fever is usually a temperature of 38°C (100.4°F) or higher. To manage a fever, drink plenty of fluids to stay hydrated, rest as much as possible, and take over-the-counter medications like paracetamol or ibuprofen. If a fever is very high or persists for more than three days, consult a doctor.""",
    """Understanding headaches: Headaches are a very common condition that most people experience many times during their lives. The main symptom is a pain in your head or face. This can be throbbing, constant, sharp or dull. The most common type is a tension headache. Triggers include stress, dehydration, and lack of sleep. Most headaches can be treated with rest and over-the-counter painkillers. However, if you experience a sudden, severe headache, or a headache after a head injury, seek immediate medical attention."""
]


try:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    documents = text_splitter.create_documents(medical_docs)
    vector_store = FAISS.from_documents(documents, embeddings)
    retriever = vector_store.as_retriever()
    print("✅ RAG system initialized successfully.")
except Exception as e:
    print(f"⚠️ RAG system failed to initialize: {e}. The RAG tool will be disabled.")
    retriever = None

# --- Define Agent Tools ---
web_search_tool = TavilySearchResults(max_results=3)
web_search_tool.description = "A search engine useful for finding doctors, clinics, or hospitals in a specific city. Use this to answer any questions about healthcare providers."

class RagQuerySchema(BaseModel):
    query: str = Field(description="A specific medical question to ask the RAG system.")

@tool(args_schema=RagQuerySchema)
def medical_assistant_rag(query: str) -> str:
    """Provides information on general medical topics using a RAG system."""
    if not retriever: return "Sorry, the medical assistant system is currently offline."
    retrieved_docs = retriever.invoke(query)
    context = "\n\n".join([doc.page_content for doc in retrieved_docs])
    final_prompt = f"Using the following context, please answer the user's question.\nContext: {context}\n\nUser's Question: {query}\n\nAlways end your answer with the disclaimer: 'This information is for educational purposes only and is not a substitute for professional medical advice.'"
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
    response = llm.invoke(final_prompt)
    return response.content

class BookAppointmentSchema(BaseModel):
    doctor_name: str = Field(description="The full name of the doctor for the appointment.")
    timeslot: str = Field(description="The chosen date and time for the appointment.")
    patient_name: str = Field(description="The full name of the patient.")
    patient_phone: str = Field(description="The patient's contact phone number.")
    patient_city: str = Field(description="The city where the patient resides.")
    patient_age: int = Field(description="The age of the patient.")

@tool(args_schema=BookAppointmentSchema)
def book_appointment(doctor_name: str, timeslot: str, patient_name: str, patient_phone: str, patient_city: str, patient_age: int) -> str:
    """Simulates booking a doctor's appointment after collecting all necessary patient details."""
    confirmation_id = f"BKNG-{uuid.uuid4().hex[:6].upper()}"
    return f"✅ Appointment Confirmed (Simulation)! \nBooking ID: {confirmation_id}\nPatient: {patient_name}, Age: {patient_age}, City: {patient_city}, Phone: {patient_phone}\nDoctor: {doctor_name}\nTime: {timeslot}"

# ===============================================================
# Cell 4: Create Agent Logic using LangGraph Prebuilt Tools
# ===============================================================

# --- State Definition ---
# Using MessagesState is a best practice when the state is a list of messages.
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessage

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

# --- Tool and LLM Setup ---
tools = [web_search_tool, medical_assistant_rag, book_appointment]
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
llm_with_tools = llm.bind_tools(tools)

# --- Agent Node Definition ---
# This node is responsible for calling the LLM.
def agent_node(state: AgentState):
    response = llm_with_tools.invoke(state['messages'])
    return {"messages": [response]}

# --- Graph Construction ---
graph_builder = StateGraph(AgentState)

# 1. Add the agent node
graph_builder.add_node("agent", agent_node)

# 2. Add the pre-built ToolNode
# This node automatically executes the tools called by the LLM.
tool_node = ToolNode(tools)
graph_builder.add_node("tools", tool_node)

# 3. Set the entry point
graph_builder.set_entry_point("agent")


graph_builder.add_conditional_edges(
    "agent",
    tools_condition,
)


graph_builder.add_edge("tools", "agent")


memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)




if __name__ == "__main__":
    print(" Advanced Doctor Agent is online. Type 'quit' to exit.")

    # A more descriptive system prompt to guide the agent's behavior
    system_prompt = (

        
        "You are a helpful Indian medical appointment assistant.  "
        "1. Use the 'tavily_search_results_json' tool to find doctors, clinics, or hospitals when a user asks. "
        "2. When a user asks a general medical question (e.g., 'what are the symptoms of a cold?'), use the 'medical_assistant_rag' tool. "
        "3. When a user wants to book an appointment, use the 'book_appointment' tool. You must ask for and collect the patient's name, phone number, city, and age before using this tool. "
        "Be polite and converse naturally."
        # "if rag tool and medical assistant is offline then you can use web search without taking persission from user and dont tell that medical assistant is offline and also dont appologize"
        "if medical assistant is offline then use llm knowledge power and advise without telling user that assistant is offline"
        "dont tell user and applogize if medical assistant is offline"
    )

    conversation_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": conversation_id}}

    while True:
        user_input = input("You: ")
        if user_input.lower() == 'quit':
            print("🤖 Goodbye! Stay healthy.")
            break

        
        initial_messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_input)]
        events = graph.stream({"messages": initial_messages}, config=config, stream_mode="values")


        for event in events:
          latest_message = event["messages"][-1]
          if isinstance(latest_message, AIMessage) and not latest_message.tool_calls:
              print(f"Agent: {latest_message.content}")