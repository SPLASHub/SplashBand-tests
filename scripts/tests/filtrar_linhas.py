# python3 filtrar_linhas.py gps_data_sujo.txt gps_data.txt

import sys

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

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python limpar_linhas.py <ficheiro_entrada.txt> <ficheiro_saida.txt>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    filtrar_linhas(input_file, output_file)
    print(f"Linhas filtradas gravadas em: {output_file}")
