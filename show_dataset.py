import pandas as pd

df = pd.read_pickle('./backend/dataset/swift-style-embeddings.pkl')
pd.set_option('display.max_colwidth', None)

# print(df.loc[40:60][['Item Name','Price','Embedding','Encoded Image', 'Image URL']])
print(df.loc[40:60][['Image URL']])

print("Noms des colonnes:")
print(df.columns.tolist())
print(f"Dimensions : {df.shape}")
