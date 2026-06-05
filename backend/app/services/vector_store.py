# import os
# import chromadb
# from chromadb.config import Settings
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain_chroma import Chroma
# from typing import List
# from langchain_core.documents import Document
# from app.config import get_settings

# settings = get_settings()

# class VectorStoreManager:
#     def __init__(self):
#         # Ensure API key is set
#         if not os.getenv('GOOGLE_API_KEY'):
#             os.environ['GOOGLE_API_KEY'] = settings.GOOGLE_API_KEY
        
#         self.embeddings = GoogleGenerativeAIEmbeddings(
#             model="models/embedding-001",
#             google_api_key=settings.GOOGLE_API_KEY  # Explicitly pass API key
#         )
#         self.persist_directory = settings.CHROMA_DB_DIR
        
#         # Initialize Chroma client
#         self.client = chromadb.PersistentClient(path=self.persist_directory)
        
#         # Initialize vector store
#         self.vector_store = Chroma(
#             client=self.client,
#             collection_name="medical_documents",
#             embedding_function=self.embeddings,
#         )
    
#     def add_documents(self, documents: List[Document]):
#         """Add documents to vector store"""
#         self.vector_store.add_documents(documents)
    
#     def get_retriever(self, k: int = 3):
#         """Get retriever for RAG"""
#         return self.vector_store.as_retriever(search_kwargs={"k": k})
    
#     def similarity_search(self, query: str, k: int = 3):
#         """Perform similarity search"""
#         return self.vector_store.similarity_search(query, k=k)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import get_settings
import os

settings = get_settings()

class VectorStoreManager:
    """Singleton Vector Store Manager to prevent ChromaDB conflicts"""
    _instance = None
    _embeddings = None
    _persist_directory = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStoreManager, cls).__new__(cls)
            # Initialize embeddings only once
            cls._embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            cls._persist_directory = settings.CHROMA_DB_DIR
        return cls._instance
    
    def __init__(self):
        # This will only run once due to singleton pattern
        pass
    
    @property
    def embeddings(self):
        return self._embeddings
    
    @property
    def persist_directory(self):
        return self._persist_directory
    
    def get_vector_store(self):
        """Get or create vector store using only persist_directory"""
        # Use persist_directory method to avoid client conflicts
        return Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="medical_documents"
        )
    
    def add_documents(self, documents):
        """Add documents to vector store"""
        vector_store = self.get_vector_store()
        vector_store.add_documents(documents)
    
    def get_retriever(self, k=3):
        """Get retriever for RAG"""
        vector_store = self.get_vector_store()
        return vector_store.as_retriever(search_kwargs={"k": k})
    
    def similarity_search(self, query, k=4):
        """Perform similarity search"""
        vector_store = self.get_vector_store()
        return vector_store.similarity_search(query, k=k)