import chromadb
import google.generativeai as genai
from backend.core.config import settings

# Initialize ChromaDB in-memory or persistent client
# For development/demo, we use an in-memory client
chroma_client = chromadb.Client()

# Initialize the Gemini API if the key is provided
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Get or create a collection for our RAG documents
# ChromaDB uses a default all-MiniLM-L6-v2 embedding model if none is provided,
# which is perfect for running locally and quickly without additional setup.
try:
    collection = chroma_client.get_collection(name="campussync_rag")
except Exception:
    collection = chroma_client.create_collection(name="campussync_rag")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """
    Very simple text chunker.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def index_document(doc_id: str, title: str, text: str, source_url: str = ""):
    """
    Clean, chunk, and index a document into ChromaDB.
    """
    # 1. Clean (very basic)
    cleaned_text = text.replace("\n", " ").strip()
    
    # 2. Chunk
    chunks = chunk_text(cleaned_text)
    
    # 3. Store in ChromaDB
    documents = []
    metadatas = []
    ids = []
    
    for i, chunk in enumerate(chunks):
        documents.append(chunk)
        metadatas.append({"title": title, "source_url": source_url})
        ids.append(f"{doc_id}_chunk_{i}")
        
    if documents:
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
    return len(documents)

def query_rag(question: str, history: list = None) -> dict:
    """
    Query the RAG system:
    1. Retrieve relevant chunks from ChromaDB.
    2. Send chunks + question (with history) to Gemini.
    3. Return structured answer with sources.
    """
    if history is None:
        history = []
        
    if collection.count() == 0:
        return {
            "answer": "I don't have any documents indexed yet to answer your question.",
            "sources": []
        }
        
    # 1. Retrieve most relevant chunks
    results = collection.query(
        query_texts=[question],
        n_results=3
    )
    
    retrieved_chunks = results['documents'][0] if results['documents'] else []
    retrieved_metadata = results['metadatas'][0] if results['metadatas'] else []
    
    context = "\n\n".join([f"Source: {meta.get('title', 'Unknown')}\nContent: {chunk}" for chunk, meta in zip(retrieved_chunks, retrieved_metadata)])
    
    
    history_text = ""
    if history:
        history_text = "Chat History:\n" + "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in history]) + "\n\n"
        
    prompt = f"""
You are the CampusSync AI Assistant. Use the following retrieved context to answer the student's question.
If the answer is not contained in the context, explicitly say that you do not have enough information to answer, and do not invent an answer.

{history_text}Context:
{context}

Question: {question}

Answer:"""

    sources = []
    for meta in retrieved_metadata:
        source_info = {"title": meta.get("title", ""), "url": meta.get("source_url", "")}
        if source_info not in sources:
            sources.append(source_info)

    # 2. Call Gemini (if key exists)
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            answer = response.text
        except Exception as e:
            answer = f"Error communicating with AI provider: {str(e)}"
    else:
        # Mock behavior for local development without API key
        answer = f"[MOCK RAG RESPONSE]\nI found some information in the database but the Gemini API key is missing. Based on the context, here is what I know:\n\n{context}\n\n(Provide a GEMINI_API_KEY in .env to get a synthesized AI answer)."

    # 3. Return
    return {
        "answer": answer,
        "sources": sources
    }
