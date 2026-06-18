import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/inyeccion/inyeccion_dependencias.dart';
import '../../../../core/red/resultado.dart';
import '../../domain/datos_beneficiario.dart';
import '../../domain/entidades/beneficiario.dart';
import '../../domain/entidades/condicion_salud.dart';
import '../../domain/entidades/olla_referencia.dart';
import '../../domain/repositorio_padron.dart';
import '../estado/estado_formulario.dart';

/// Controller del formulario de alta/edición de beneficiarios. Carga las
/// opciones (condiciones y ollas) y envía el alta o la actualización.
class ControllerFormulario extends Notifier<EstadoFormulario> {
  late final RepositorioPadron _repositorio;
  List<CondicionSalud> _condiciones = <CondicionSalud>[];
  List<OllaReferencia> _ollas = <OllaReferencia>[];

  @override
  EstadoFormulario build() {
    _repositorio = sl<RepositorioPadron>();
    return const EstadoFormulario.cargando();
  }

  Future<void> cargarOpciones() async {
    state = const EstadoFormulario.cargando();
    final List<dynamic> resultados = await Future.wait<dynamic>(<Future<dynamic>>[
      _repositorio.listarCondiciones(),
      _repositorio.listarOllas(),
    ]);
    final Resultado<List<CondicionSalud>> resCond = resultados[0] as Resultado<List<CondicionSalud>>;
    final Resultado<List<OllaReferencia>> resOllas = resultados[1] as Resultado<List<OllaReferencia>>;
    if (resCond is Fallo<List<CondicionSalud>>) {
      state = EstadoFormulario.error(resCond.excepcion.mensaje);
      return;
    }
    if (resOllas is Fallo<List<OllaReferencia>>) {
      state = EstadoFormulario.error(resOllas.excepcion.mensaje);
      return;
    }
    _condiciones = (resCond as Exito<List<CondicionSalud>>).valor;
    _ollas = (resOllas as Exito<List<OllaReferencia>>).valor;
    state = EstadoFormulario.listo(_condiciones, _ollas);
  }

  Future<void> guardar(DatosBeneficiario datos, {String? idEdicion}) async {
    state = const EstadoFormulario.guardando();
    final Resultado<Beneficiario> resultado = idEdicion == null
        ? await _repositorio.crear(datos)
        : await _repositorio.actualizar(idEdicion, datos);
    state = switch (resultado) {
      Exito<Beneficiario>() => const EstadoFormulario.guardado(),
      Fallo<Beneficiario>(:final excepcion) => EstadoFormulario.error(excepcion.mensaje),
    };
  }

  /// Vuelve al estado "listo" reusando las opciones ya cargadas (tras un error).
  void volverAListo() {
    state = EstadoFormulario.listo(_condiciones, _ollas);
  }
}

final NotifierProvider<ControllerFormulario, EstadoFormulario> controllerFormularioProvider =
    NotifierProvider<ControllerFormulario, EstadoFormulario>(ControllerFormulario.new);
