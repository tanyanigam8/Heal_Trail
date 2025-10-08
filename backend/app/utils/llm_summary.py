from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
import os
import tempfile

def get_rag_summary_chain(text: str):
    # Use real extracted text for document chunking
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    docs = text_splitter.create_documents([text])

    # Embeddings and vector store
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    persist_dir = os.path.join(tempfile.gettempdir(), "chroma_health_rag")
    vectorstore = Chroma.from_documents(docs, embeddings, persist_directory=persist_dir)
    retriever = vectorstore.as_retriever()

    # LLM
    llm = OllamaLLM(model="mistral")

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        return_source_documents=False,
    )

    return chain
