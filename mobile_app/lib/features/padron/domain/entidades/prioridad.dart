/// Nivel de prioridad de atención de un beneficiario.
enum Prioridad {
  baja,
  normal,
  alta;

  /// Código que usa la API (`low` / `normal` / `high`).
  String get codigoApi => switch (this) {
        Prioridad.baja => 'low',
        Prioridad.normal => 'normal',
        Prioridad.alta => 'high',
      };

  String get etiqueta => switch (this) {
        Prioridad.baja => 'Baja',
        Prioridad.normal => 'Normal',
        Prioridad.alta => 'Alta',
      };

  /// Construye la prioridad desde el código de la API.
  static Prioridad desdeCodigo(String? codigo) => switch (codigo) {
        'low' => Prioridad.baja,
        'high' => Prioridad.alta,
        _ => Prioridad.normal,
      };
}
