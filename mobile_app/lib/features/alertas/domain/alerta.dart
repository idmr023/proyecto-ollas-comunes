/// Severidad/categoría de una alerta, derivada del tipo que envía la API.
enum TipoAlerta {
  stockBajo,
  general,
  sincronizacion;

  static TipoAlerta desdeCodigo(String? codigo) => switch (codigo) {
    'bajo_stock' => TipoAlerta.stockBajo,
    'sincronizacion' => TipoAlerta.sincronizacion,
    _ => TipoAlerta.general,
  };
}

/// Alerta operativa de la olla común (stock bajo, reporte faltante, etc.).
class Alerta {
  const Alerta({
    required this.id,
    required this.tipo,
    required this.titulo,
    required this.descripcion,
    required this.fecha,
  });

  final String id;
  final TipoAlerta tipo;
  final String titulo;
  final String descripcion;
  final String fecha;

  factory Alerta.desdeJson(Map<String, dynamic> json) {
    return Alerta(
      id: json['id'] as String? ?? '',
      tipo: TipoAlerta.desdeCodigo(json['tipo'] as String?),
      titulo: json['titulo'] as String? ?? '',
      descripcion: json['descripcion'] as String? ?? '',
      fecha: json['fecha'] as String? ?? '',
    );
  }
}
