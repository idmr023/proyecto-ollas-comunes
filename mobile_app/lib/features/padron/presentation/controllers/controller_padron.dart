import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/entidades/beneficiario.dart';
import '../../domain/repositorio_padron.dart';
import '../estado/estado_padron.dart';

/// Controller de la lista del padrón. Maneja la carga, búsqueda y eliminación.
class ControllerPadron extends Notifier<EstadoPadron> {
  late final RepositorioPadron _repositorio;

  @override
  EstadoPadron build() {
    _repositorio = sl<RepositorioPadron>();
    return const EstadoPadron.inicial();
  }

  Future<void> cargar({String? busqueda}) async {
    state = const EstadoPadron.cargando();
    final Resultado<List<Beneficiario>> resultado = await _repositorio.listar(busqueda: busqueda);
    state = switch (resultado) {
      Exito<List<Beneficiario>>(:final List<Beneficiario> valor) => EstadoPadron.exito(valor),
      Fallo<List<Beneficiario>>(:final excepcion) => EstadoPadron.error(excepcion.mensaje),
    };
  }

  /// Elimina un beneficiario. Devuelve `null` si fue exitoso o el mensaje de error.
  Future<String?> eliminar(String id) async {
    final Resultado<void> resultado = await _repositorio.eliminar(id);
    return switch (resultado) {
      Exito<void>() => () {
          cargar();
          return null;
        }(),
      Fallo<void>(:final excepcion) => excepcion.mensaje,
    };
  }
}

final NotifierProvider<ControllerPadron, EstadoPadron> controllerPadronProvider =
    NotifierProvider<ControllerPadron, EstadoPadron>(ControllerPadron.new);
