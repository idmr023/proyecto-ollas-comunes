import 'package:flutter/material.dart';
import '../../../core/constantes/constantes_app.dart';
import '../../../core/tema/colores_app.dart';

/// Modal de confirmación para acciones sensibles (ej. eliminar). Devuelve si el
/// usuario confirmó la acción.
class ModalConfirmacion extends StatelessWidget {
  const ModalConfirmacion({
    super.key,
    required this.titulo,
    required this.mensaje,
    this.textoConfirmar = 'Sí, continuar',
    this.esDestructiva = true,
  });

  final String titulo;
  final String mensaje;
  final String textoConfirmar;
  final bool esDestructiva;

  /// Muestra el modal y devuelve `true` si el usuario confirmó.
  static Future<bool> mostrar(
    BuildContext context, {
    required String titulo,
    required String mensaje,
    String textoConfirmar = 'Sí, continuar',
    bool esDestructiva = true,
  }) async {
    final bool? confirmado = await showDialog<bool>(
      context: context,
      barrierColor: ColoresApp.verdeProfundo.withValues(alpha: 0.5),
      builder: (_) => ModalConfirmacion(
        titulo: titulo,
        mensaje: mensaje,
        textoConfirmar: textoConfirmar,
        esDestructiva: esDestructiva,
      ),
    );
    return confirmado ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final Color colorConfirmar = esDestructiva
        ? ColoresApp.criticoPunto
        : ColoresApp.primario;
    return Dialog(
      backgroundColor: ColoresApp.superficie,
      insetPadding: const EdgeInsets.all(Espaciado.xl),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Radios.xl),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: ColoresApp.bajoFondo,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: ColoresApp.bajoTexto,
                size: 36,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              titulo,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: ColoresApp.textoTerciario,
              ),
            ),
            const SizedBox(height: 22),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: colorConfirmar),
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(textoConfirmar),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: ColoresApp.textoTerciario),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
