# python3 adicionar_csv.py gps_data.txt gps_data.csv

import sys
import csv
import os
from scripts.tests.filtrar_linhas import filtrar_linhas
from scripts.tests.ler_dados_gps import converter_logs_para_csv

def colar_csv_e_remover(entrada, destino):
    # Abre o ficheiro de destino em modo append
    with open(destino, "a", newline="", encoding="utf-8") as f_dest:
        writer = csv.writer(f_dest)

        # Abre o ficheiro auxiliar para leitura
        with open(entrada, "r", newline="", encoding="utf-8") as f_aux:
            reader = csv.reader(f_aux)
            for row in reader:
                writer.writerow(row)

    print(f"Conteúdo de '{entrada}' colado em '{destino}' e ficheiro auxiliar removido.")

if __name__ == "__main__":
    input_file = "gps_data.txt"
    output_file = "gps_data.csv"
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]


    filtrar_linhas(input_file, "aux_gps_data.txt")
    converter_logs_para_csv("aux_gps_data.txt", "aux_gps_data.csv")
    os.remove("aux_gps_data.txt") # Apaga o ficheiro auxiliar
    colar_csv_e_remover("aux_gps_data.csv", output_file)
    os.remove("aux_gps_data.csv") # Apaga o ficheiro auxiliar
    open(input_file, "w").close() # Limpa o ficheiro de entrada
    print(f"Dados filtrados de {input_file} e convertidos adicionados a {output_file}")

