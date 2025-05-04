# source .venv/bin/activate
# pip install pyserial
# python3 gravacao_monitor_gps.py

import serial
import sys
import csv
import os
import re

def filtrar_linhas(input_file, output_file):
    # Palavras ou padrões a eliminar
    padroes = [
        "update_location_speed_data()",
        "=>",
        "latitude",
        "longitude",
        "altitude",
        "speed",
        "0x"
    ]

    with open(input_file, "r", encoding="utf-8") as f_in, open(output_file, "w", encoding="utf-8") as f_out:
        for linha in f_in:
            if not any(p in linha for p in padroes):
                f_out.write(linha)

def converter_logs_para_csv(arquivo_entrada, arquivo_saida):
    """
    Lê o arquivo_entrada (com as linhas de log do NMEA) e gera um arquivo CSV arquivo_saida
    no formato:
      latitude, lat_float, lat_double, longitude, lon_float, lon_double
    """

    # Expressões regulares para facilitar a extração dos valores
    # "parse_lat_long: 4037.91636" -> queremos capturar "4037.91636"
    regex_parse_lat_long = re.compile(r"parse_lat_long:\s+(\S+)")
    # ":float degres 40.631938934" -> queremos capturar "40.631938934"
    regex_float_degres = re.compile(r":float degres\s+(\S+)")
    # ":double degres 40.631937663" -> queremos capturar "40.631937663"
    regex_double_degres = re.compile(r":double degres\s+(\S+)")

    # Vamos guardar pares (lat, lat_f, lat_d, lon, lon_f, lon_d)
    linhas_csv = []

    with open(arquivo_entrada, "r", encoding="utf-8") as f:
        linhas_log = f.readlines()

    i = 0
    # Percorre cada grupo de 6 linhas relevantes (ou até encontrar todas)
    while i < len(linhas_log):
        linha = linhas_log[i].strip()

        # Verifica se a linha atual corresponde a "parse_lat_long" (latitude)
        if "parse_lat_long:" in linha:
            # 1) latitude
            match_lat = regex_parse_lat_long.search(linha)
            if not match_lat:
                i += 1
                continue
            latitude_raw = match_lat.group(1)

            # 2) linha seguinte deve ter ":float degres" (latitude float)
            if i+1 < len(linhas_log):
                match_lat_float = regex_float_degres.search(linhas_log[i+1])
            else:
                break
            # 3) depois ":double degres" (latitude double)
            if i+2 < len(linhas_log):
                match_lat_double = regex_double_degres.search(linhas_log[i+2])
            else:
                break

            # Passa para a próxima posição após processar latitude
            i += 3

            # Verifica se a linha seguinte é parse_lat_long (longitude)
            if i < len(linhas_log) and "parse_lat_long:" in linhas_log[i]:
                match_lon = regex_parse_lat_long.search(linhas_log[i])
                if not match_lon:
                    i += 1
                    continue
                longitude_raw = match_lon.group(1)

                # 5) linha seguinte deve ter ":float degres" (longitude float)
                if i+1 < len(linhas_log):
                    match_lon_float = regex_float_degres.search(linhas_log[i+1])
                else:
                    break
                # 6) depois ":double degres" (longitude double)
                if i+2 < len(linhas_log):
                    match_lon_double = regex_double_degres.search(linhas_log[i+2])
                else:
                    break

                # Avança mais 3 linhas (após longitude)
                i += 3

                # Agora montamos os valores obtidos
                if match_lat_float and match_lat_double and \
                   match_lon_float and match_lon_double:

                    lat_float = match_lat_float.group(1)
                    lat_double = match_lat_double.group(1)
                    lon_float = match_lon_float.group(1)
                    lon_double = match_lon_double.group(1)

                    # Adiciona no array que iremos escrever como CSV
                    linhas_csv.append([
                        latitude_raw,
                        lat_float,
                        lat_double,
                        longitude_raw,
                        lon_float,
                        lon_double
                    ])
            else:
                # Se não encontrarmos parse_lat_long para a longitude, apenas avança
                i += 1
        else:
            i += 1

    # Escreve no arquivo CSV final
    with open(arquivo_saida, "w", encoding="utf-8") as out:
        for linha_csv in linhas_csv:
            out.write(",".join(linha_csv) + "\n")

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
    
def ler_serial_e_guardar(porta="/dev/ttyACM0", baudrate=115200, ficheiro_saida="gps_data.txt"):
    try:
        with serial.Serial(porta, baudrate, timeout=1) as ser, open(ficheiro_saida, "a", encoding="utf-8") as f_out:
            print(f"Ligado a {porta} @ {baudrate} baud")
            print(f"A escrever dados em: {ficheiro_saida}")
            print("(CTRL+C para parar)\n")

            while True:
                linha = ser.readline().decode('utf-8', errors='ignore').strip()
                if linha:
                    print(linha)
                    f_out.write(linha + "\n")
                    f_out.flush()  # Garante que escreve no disco imediatamente

    except serial.SerialException as e:
        print(f"Erro de ligação à porta: {e}")
    except KeyboardInterrupt:
        print("\nLeitura interrompida pelo utilizador.")
    
if __name__ == "__main__":
    input_file = "gps_data.txt"
    output_file = "gps_data.csv"

    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]

    ler_serial_e_guardar(ficheiro_saida=input_file)
    # SO EXECUTA ESTES PASSOS DEPOIS DE CRTL+C
    filtrar_linhas(input_file, "aux_gps_data.txt")
    converter_logs_para_csv("aux_gps_data.txt", "aux_gps_data.csv")
    open(input_file, "w").close() # Limpa o ficheiro de entrada
    colar_csv_e_remover("aux_gps_data.csv", output_file)
    os.remove("aux_gps_data.txt") # Apaga o ficheiro auxiliar
    os.remove("aux_gps_data.csv") # Apaga o ficheiro auxiliar

    print(f"\n✅ Dados convertidos adicionados a {output_file}")