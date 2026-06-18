import 'estado_stock.dart';

/// Insumo del inventario de la olla común con su stock actual.
class Insumo {
  const Insumo({
    required this.id,
    required this.nombre,
    required this.cantidad,
    required this.unidad,
    required this.esPerecedero,
  });

  final String id;
  final String nombre;
  final double cantidad;
  final String unidad;
  final bool esPerecedero;

  EstadoStock get estado => EstadoStock.segunCantidad(cantidad);

  /// Inicial para el avatar de la lista (ej. "Arroz" → "A").
  String get inicial => nombre.isNotEmpty ? nombre[0].toUpperCase() : '?';

  /// Cantidad formateada sin decimales innecesarios (ej. 4.0 → "4", 0.5 → "0.5").
  String get cantidadFormateada {
    return cantidad == cantidad.roundToDouble() ? cantidad.toInt().toString() : cantidad.toString();
  }

  factory Insumo.desdeJson(Map<String, dynamic> json) {
    return Insumo(
      id: json['id'] as String? ?? '',
      nombre: json['nombre'] as String? ?? '',
      cantidad: (json['cantidad'] as num?)?.toDouble() ?? 0,
      unidad: json['unidad'] as String? ?? '',
      esPerecedero: json['esPerecedero'] as bool? ?? false,
    );
  }
}
