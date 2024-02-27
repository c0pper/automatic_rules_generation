import os
from rule_generation import get_all_domains
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv
load_dotenv()

PERSIST_DIRECTORY = f"vector_db"


def create_vectorstore(docs=None):
    print("[+] Creating db")
    #  If embeddings database already exists > read it, else > create it
    if os.path.exists(PERSIST_DIRECTORY) and os.path.isdir(PERSIST_DIRECTORY):
        print("Directory 'db' exists. Using existing vectordb")
        db = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)

    else:
        # pass
        if docs == None:
            raise ValueError("No docs found")
        else:
            print("Directory 'db' does not exist. Creating new vectordb")
            db = Chroma.from_documents(docs, embeddings, persist_directory=PERSIST_DIRECTORY)
            db.persist()

    return db

embeddings = OpenAIEmbeddings()

with open("icd9.xml", "r", encoding="utf8") as f:
    taxonomy_str = f.read()
domains = get_all_domains(taxonomy_str)

print("[+] Creating docs")
docs = [Document(page_content=d["DESCRIPTION"], metadata={"NAME": d["NAME"]}) for d in domains]
db = create_vectorstore(docs)

while True:
    query = input("Testo: ")
    docs = db.similarity_search(query, k=5)
    for d in docs:
        print(f"{d[0].page_content} - {docs[0].metadata['NAME']}")