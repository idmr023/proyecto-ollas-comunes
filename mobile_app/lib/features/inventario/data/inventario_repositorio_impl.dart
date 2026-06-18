import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/entidades/insumo.dart';
import '../domain/repositorio_inventario.dart';
import '../domain/tipo_movimiento.dart';
import 'inventario_api.dart';

/// Implementación del [RepositorioInventario] sobre la API REST.
class InventarioRepositorioImpl implements RepositorioInventario {
  InventarioRepositorioImpl(this._api);

  final InventarioApi _api;

  @override
  Future<Resultado<List<Insumo>>> obtenerInventario() async {
    try {
      final Map<String, dynamic> datos = await _api.obtenerInventario();
      final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      final List<Insumo> insumos = items
          .map((dynamic e) => Insumo.desdeJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return Resultado<List<Insumo>>.exito(insumos);
    } on DioException catch (err) {
      return Resultado<List<Insumo>>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<void>> registrarMovimiento({
    required String insumoId,
    required TipoMovimiento tipo,
    required double cantidad,
    String? nota,
  }) async {
    try {
      await _api.registrarMovimiento(
        insumoId: insumoId,
        tipoApi: tipo.codigoApi,
        cantidad: cantidad,
        nota: nota,
      );
      return const Resultado<void>.exito(null);
    } on DioException catch (err) {
      return Resultado<void>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
