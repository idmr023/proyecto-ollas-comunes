/// Datos del menú planificado para el día.
class MenuDia {
  const MenuDia({
    required this.plato,
    required this.estado,
    required this.racionesPosibles,
  });

  final String plato;
  final String estado;
  final int racionesPosibles;

  factory MenuDia.desdeJson(Map<String, dynamic> json) {
    return MenuDia(
      plato: json['dishName'] as String? ?? '',
      estado: json['status'] as String? ?? '',
      racionesPosibles: (json['maxServingsRemaining'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Insumo perecible próximo a vencer mostrado en el dashboard.
class InsumoPorVencer {
  const InsumoPorVencer({
    required this.nombre,
    required this.cantidad,
    required this.venceEn,
  });

  final String nombre;
  final String cantidad;
  final String venceEn;

  factory InsumoPorVencer.desdeJson(Map<String, dynamic> json) {
    return InsumoPorVencer(
      nombre: json['nombre'] as String? ?? '',
      cantidad: json['cantidad'] as String? ?? '',
      venceEn: json['venceEn'] as String? ?? '',
    );
  }
}

/// Resumen del dashboard de la olla común para el día actual.
class ResumenDashboard {
  const ResumenDashboard({
    required this.nombreOlla,
    required this.racionesEntregadas,
    required this.racionesPlanificadas,
    required this.menuDia,
    required this.insumosPorVencer,
  });

  final String nombreOlla;
  final int racionesEntregadas;
  final int racionesPlanificadas;
  final MenuDia? menuDia;
  final List<InsumoPorVencer> insumosPorVencer;

  factory ResumenDashboard.desdeJson(Map<String, dynamic> json) {
    final Map<String, dynamic>? olla = json['olla'] as Map<String, dynamic>?;
    final Map<String, dynamic> resumen =
        (json['summary'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final Map<String, dynamic>? menu = resumen['menu'] as Map<String, dynamic>?;
    final List<dynamic> porVencer =
        (json['expiring'] as List<dynamic>?) ?? <dynamic>[];
    return ResumenDashboard(
      nombreOlla: olla?['name'] as String? ?? 'Sin olla asignada',
      racionesEntregadas: (resumen['entregadas'] as num?)?.toInt() ?? 0,
      racionesPlanificadas: (resumen['planificadas'] as num?)?.toInt() ?? 0,
      menuDia: menu == null ? null : MenuDia.desdeJson(menu),
      insumosPorVencer: porVencer
          .map(
            (dynamic e) =>
                InsumoPorVencer.desdeJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList(),
    );
  }
}
