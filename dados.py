import pandas as pd

url = "https://raw.githubusercontent.com/MatheusFernandesCarillo/analise-jogos/refs/heads/main/data/Video_Games_Sales_as_at_22_Dec_2016.csv"
df = pd.read_csv(url)

df.columns = [
    "Nome", "Plataforma", "Lançamento", "Genero", "Publicadora",
    "Vendas_EUA", "Vendas_Europa", "Vendas_Japão", "Vendas_Outros",
    "Vendas_Global", "Nota_Critica", "Contagem_Criticos",
    "Nota_Usuario", "Contagem_Usuarios", "Desenvolvedora", "Classificação"
]


df_limpo = df.drop(columns=['Nota_Critica', 'Contagem_Criticos', 'Nota_Usuario', 'Contagem_Usuarios'])
df_limpo['Lançamento'] = df_limpo['Lançamento'].fillna(0).astype(int)
df_limpo = df_limpo[df_limpo['Lançamento'] != 0]
df_limpo = df_limpo.dropna(subset=['Genero'])


df_limpo.to_csv('jogos_organizado.csv', index=False)

print("Dados processados salvos!")
