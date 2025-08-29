from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Minha API de Culturas")

class RequisicaoCultura(BaseModel):
    temperatura: float
    umidade: float
    tipo_solo: str

def recomendar_cultura(temperatura, umidade, tipo_solo):
    if tipo_solo == "argiloso":
        if temperatura > 25 and umidade > 60:
            return "Arroz"
        else:
            return "Trigo"
    elif tipo_solo == "arenoso":
        if temperatura > 20 and umidade < 50:
            return "Milho"
        else:
            return "Feijão"
    elif tipo_solo == "humífero":
        return "Soja"
    else:
        return "Não sei recomendar"

@app.get("/")
def raiz():
    return {"mensagem": "Oi! Minha API de recomendação de culturas está funcionando."}

@app.get("/teste")
def teste():
    return {"status": "API funcionando"}

@app.get("/recomendar-get")
def recomendar_get(temperatura: float, umidade: float, tipo_solo: str):
    cultura = recomendar_cultura(temperatura, umidade, tipo_solo.lower())
    return {"cultura_recomendada": cultura}

@app.post("/recomendar-post")
def recomendar_post(dados: RequisicaoCultura):
    cultura = recomendar_cultura(dados.temperatura, dados.umidade, dados.tipo_solo.lower())
    return {"cultura_recomendada": cultura}

@app.get("/tipos-solo")
def tipos_solo():
    return {"tipos_solo": ["argiloso", "arenoso", "humífero"]}
