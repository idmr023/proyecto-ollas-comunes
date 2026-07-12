import '../../../core/red/resultado.dart';
import 'datos_beneficiario.dart';
import 'entidades/beneficiario.dart';
import 'entidades/condicion_salud.dart';
import 'entidades/olla_referencia.dart';

/// Contrato del repositorio del padrón de beneficiarios.
abstract interface class RepositorioPadron {
  /// Lista los beneficiarios del tenant, con búsqueda opcional por texto.
  Future<Resultado<List<Beneficiario>>> listar({String? busqueda});

  /// Registra un nuevo beneficiario.
  Future<Resultado<Beneficiario>> crear(DatosBeneficiario datos);

  /// Actualiza un beneficiario existente.
  Future<Resultado<Beneficiario>> actualizar(
    String id,
    DatosBeneficiario datos,
  );

  /// Elimina un beneficiario del padrón.
  Future<Resultado<void>> eliminar(String id);

  Future<Resultado<void>> registrarEntrega({
    required List<String> beneficiarioIds,
    String? nombrePlato,
  });

  /// Lista las condiciones de salud disponibles.
  Future<Resultado<List<CondicionSalud>>> listarCondiciones();

  /// Lista las ollas del tenant para asignarlas a un beneficiario.
  Future<Resultado<List<OllaReferencia>>> listarOllas();
}
