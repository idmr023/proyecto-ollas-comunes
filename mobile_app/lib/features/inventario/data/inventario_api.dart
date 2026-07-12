import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';

/// Acceso de bajo nivel a los endpoints de inventario de la app móvil.
class InventarioApi {
  InventarioApi(this._cliente);

  final ClienteHttp _cliente;

  Future<Map<String, dynamic>> obtenerInventario() async {
    final Response<dynamic> respuesta = await _cliente.obtener(
      '/mobile/inventory',
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<void> registrarMovimiento({
    required String insumoId,
    required String tipoApi,
    required double cantidad,
    String? nota,
  }) async {
    await _cliente.publicar(
      '/mobile/inventory/movements',
      cuerpo: <String, dynamic>{
        'supplyItemId': insumoId,
        'movementType': tipoApi,
        'quantity': cantidad,
        if (nota != null && nota.isNotEmpty) 'notes': nota,
      },
    );
  }
}
