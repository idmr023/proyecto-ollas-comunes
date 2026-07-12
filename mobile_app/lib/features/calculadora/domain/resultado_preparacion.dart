/// Cálculo de un ingrediente: cuánto se necesita, cuánto hay y cuánto falta.
class IngredienteCalculado {
  const IngredienteCalculado({
    required this.nombre,
    required this.unidad,
    required this.necesario,
    required this.stockActual,
    required this.faltante,
    required this.alcanza,
  });

  final String nombre;
  final String unidad;
  final double necesario;
  final double stockActual;
  final double faltante;
  final bool alcanza;

  factory IngredienteCalculado.desdeJson(Map<String, dynamic> json) {
    return IngredienteCalculado(
      nombre: json['nombre'] as String? ?? '',
      unidad: json['unidad'] as String? ?? '',
      necesario: (json['necesario'] as num?)?.toDouble() ?? 0,
      stockActual: (json['stockActual'] as num?)?.toDouble() ?? 0,
      faltante: (json['faltante'] as num?)?.toDouble() ?? 0,
      alcanza: json['alcanza'] as bool? ?? false,
    );
  }
}

/// Resultado completo de la calculadora de preparación para una receta.
class ResultadoPreparacion {
  const ResultadoPreparacion({
    required this.nombreReceta,
    required this.personas,
    required this.fuentePersonas,
    required this.racionesPosiblesConStock,
    required this.alcanzaParaTodos,
    required this.ingredientes,
    required this.ingredientesFaltantes,
  });

  final String nombreReceta;
  final int personas;
  final String fuentePersonas;
  final int racionesPosiblesConStock;
  final bool alcanzaParaTodos;
  final List<IngredienteCalculado> ingredientes;
  final int ingredientesFaltantes;

  bool get personasDesdePadron => fuentePersonas == 'padron';

  factory ResultadoPreparacion.desdeJson(Map<String, dynamic> json) {
    final Map<String, dynamic> receta =
        (json['receta'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final Map<String, dynamic> resumen =
        (json['resumen'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final List<dynamic> ingredientes =
        (json['ingredientes'] as List<dynamic>?) ?? <dynamic>[];
    return ResultadoPreparacion(
      nombreReceta: receta['nombre'] as String? ?? '',
      personas: (json['personas'] as num?)?.toInt() ?? 0,
      fuentePersonas: json['fuentePersonas'] as String? ?? 'manual',
      racionesPosiblesConStock:
          (json['racionesPosiblesConStock'] as num?)?.toInt() ?? 0,
      alcanzaParaTodos: json['alcanzaParaTodos'] as bool? ?? false,
      ingredientes: ingredientes
          .map(
            (dynamic e) => IngredienteCalculado.desdeJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList(),
      ingredientesFaltantes:
          (resumen['ingredientesFaltantes'] as num?)?.toInt() ?? 0,
    );
  }
}
