import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../core/red/resultado.dart';
import '../domain/repositorio_evidencias.dart';
import 'estado_evidencia.dart';

/// Controller de la subida de evidencias.
class ControllerEvidencia extends Notifier<EstadoEvidencia> {
  late final RepositorioEvidencias _repositorio;

  @override
  EstadoEvidencia build() {
    _repositorio = sl<RepositorioEvidencias>();
    return const EstadoEvidencia.inicial();
  }

  Future<void> subir(DatosEvidencia datos) async {
    state = const EstadoEvidencia.subiendo();
    final Resultado<void> resultado = await _repositorio.subir(datos);
    state = switch (resultado) {
      Exito<void>() => const EstadoEvidencia.exito(),
      Fallo<void>(:final excepcion) => EstadoEvidencia.error(excepcion.mensaje),
    };
  }

  void reiniciar() {
    state = const EstadoEvidencia.inicial();
  }
}

final NotifierProvider<ControllerEvidencia, EstadoEvidencia> controllerEvidenciaProvider =
    NotifierProvider<ControllerEvidencia, EstadoEvidencia>(ControllerEvidencia.new);
