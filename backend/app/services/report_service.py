def build_admin_report():
    return {
        "total_people": 1248,
        "active_routes": 86,
        "active_sos": 3,
        "help_requests": 8,
        "beacons_online": 142,
        "beacons_attention": 1,
        "busiest_sector": "Recepção Principal",
        "sector_with_most_calls": "Setor de Imagem",
        "average_route_time": "3 min",
        "average_response_time": "4 min",
        "accessible_routes_used": 37,
        "critical_alerts": 2,
        "movement_summary": (
            "Fluxo elevado na recepção e concentração de deslocamentos no Setor de Imagem "
            "entre 14h e 16h."
        ),
        "recommendations": [
            "Reforçar equipe no Setor de Imagem.",
            "Verificar beacon MBM04-03 com instabilidade.",
            "Sugerir rota alternativa para Recepção Principal em horários de pico.",
            "Monitorar chamados de locomoção.",
            "Revisar tempo médio de resposta para SOS crítico.",
        ],
    }
