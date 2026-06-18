import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entidades/condicion_salud.dart';
import '../../domain/entidades/olla_referencia.dart';

part 'estado_formulario.freezed.dart';

/// Estado de UI del formulario de alta/edición de beneficiarios.
@freezed
class EstadoFormulario with _$EstadoFormulario {
  /// Cargando las opciones (condiciones de salud y ollas).
  const factory EstadoFormulario.cargando() = FormularioCargando;

  /// Opciones listas: el formulario puede llenarse.
  const factory EstadoFormulario.listo(
    List<CondicionSalud> condiciones,
    List<OllaReferencia> ollas,
  ) = FormularioListo;

  /// Guardando el beneficiario.
  const factory EstadoFormulario.guardando() = FormularioGuardando;

  /// Beneficiario guardado correctamente.
  const factory EstadoFormulario.guardado() = FormularioGuardado;

  /// Error al cargar opciones o al guardar.
  const factory EstadoFormulario.error(String mensaje) = FormularioError;
}
