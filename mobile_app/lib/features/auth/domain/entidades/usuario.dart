/// Usuario autenticado del sistema, con su organización (tenant) y rol.
class Usuario {
  const Usuario({
    required this.id,
    required this.email,
    required this.nombreCompleto,
    required this.rol,
    required this.tenantId,
    required this.nombreTenant,
  });

  final String id;
  final String email;
  final String nombreCompleto;
  final String rol;
  final String tenantId;
  final String nombreTenant;

  /// Construye un [Usuario] desde el JSON `user` que devuelve la API.
  factory Usuario.desdeJson(Map<String, dynamic> json) {
    return Usuario(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      nombreCompleto: json['fullName'] as String? ?? '',
      rol: json['role'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      nombreTenant: json['tenantName'] as String? ?? '',
    );
  }

  /// Iniciales del nombre para mostrar en avatares (ej. "Vanessa Meneses" → "VM").
  String get iniciales {
    final List<String> partes = nombreCompleto.trim().split(RegExp(r'\s+'));
    if (partes.isEmpty || partes.first.isEmpty) return '?';
    final String primera = partes.first[0];
    final String segunda = partes.length > 1 ? partes[1][0] : '';
    return (primera + segunda).toUpperCase();
  }
}
