import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/repositorio_inventario.dart';
import '../../domain/tipo_movimiento.dart';
import '../estado/estado_movimiento.dart';

/// Controller del registro de un movimiento de inventario.
class ControllerMovimiento extends Notifier<EstadoMovimiento> {
  late final RepositorioInventario _repositorio;

  @override
  EstadoMovimiento build() {
    _repositorio = sl<RepositorioInventario>();
    return const EstadoMovimiento.inicial();
  }

  Future<void> registrar({
    required String insumoId,
    required TipoMovimiento tipo,
    required double cantidad,
    String? nota,
  }) async {
    state = const EstadoMovimiento.guardando();
    final Resultado<void> resultado = await _repositorio.registrarMovimiento(
      insumoId: insumoId,
      tipo: tipo,
      cantidad: cantidad,
      nota: nota,
    );
    state = switch (resultado) {
      Exito<void>() => const EstadoMovimiento.exito(),
      Fallo<void>(:final excepcion) => EstadoMovimiento.error(
        excepcion.mensaje,
      ),
    };
  }

  void reiniciar() {
    state = const EstadoMovimiento.inicial();
  }
}

final NotifierProvider<ControllerMovimiento, EstadoMovimiento>
controllerMovimientoProvider =
    NotifierProvider<ControllerMovimiento, EstadoMovimiento>(
      ControllerMovimiento.new,
    );
