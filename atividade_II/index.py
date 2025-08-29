from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


app = FastAPI()

# Modelo de dados
class TarefaCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    concluida: bool = False

class Tarefa(TarefaCreate):
    id: int

tarefas: List[Tarefa] = []
prox_id = 1 

# Listar todas as tarefas
@app.get("/tarefas", response_model=List[Tarefa])
def listar_tarefas():
    return tarefas

# Criar nova tarefa
@app.post("/tarefas", response_model=Tarefa)
def criar_tarefa(tarefa: TarefaCreate):
    global prox_id
    nova_tarefa = Tarefa(id=prox_id, **tarefa.dict())
    tarefas.append(nova_tarefa)
    prox_id += 1
    return nova_tarefa

@app.get("/tarefas/{tarefa_id}", response_model=Tarefa)
def buscar_tarefa(tarefa_id: int):
    for tarefa in tarefas:
        if tarefa.id == tarefa_id:
            return tarefa
    raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

@app.put("/tarefas/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(tarefa_id: int, tarefa_atualizada: TarefaCreate):
    for i, tarefa in enumerate(tarefas):
        if tarefa.id == tarefa_id:
            tarefas[i] = Tarefa(id=tarefa_id, **tarefa_atualizada.dict())
            return tarefas[i]
    raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

@app.delete("/tarefas/{tarefa_id}")
def deletar_tarefa(tarefa_id: int):
    for i, tarefa in enumerate(tarefas):
        if tarefa.id == tarefa_id:
            del tarefas[i]
            return {"mensagem": "Tarefa deletada com sucesso."}
    raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")