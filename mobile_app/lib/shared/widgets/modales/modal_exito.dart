import 'package:flutter/material.dart';
import '../../../core/constantes/constantes_app.dart';
import '../../../core/tema/colores_app.dart';

/// Modal de éxito reutilizable. Muestra un check verde, un título y un mensaje,
/// con un único botón de confirmación.
class ModalExito extends StatelessWidget {
  const ModalExito({
    super.key,
    this.titulo = '¡Listo!',
    required this.mensaje,
    this.textoBoton = 'Entendido',
  });

  final String titulo;
  final String mensaje;
  final String textoBoton;

  /// Muestra el modal de éxito de forma centrada y modal.
  static Future<void> mostrar(
    BuildContext context, {
    String titulo = '¡Listo!',
    required String mensaje,
    String textoBoton = 'Entendido',
  }) {
    return showDialog<void>(
      context: context,
      barrierColor: ColoresApp.verdeProfundo.withValues(alpha: 0.5),
      builder: (_) => ModalExito(titulo: titulo, mensaje: mensaje, textoBoton: textoBoton),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: ColoresApp.superficie,
      insetPadding: const EdgeInsets.all(Espaciado.xl),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radios.xl)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const _IconoCircular(
              fondo: ColoresApp.okFondo,
              icono: Icons.check_rounded,
              color: ColoresApp.okPunto,
            ),
            const SizedBox(height: 18),
            Text(titulo, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: ColoresApp.textoTerciario),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(textoBoton),
            ),
          ],
        ),
      ),
    );
  }
}

class _IconoCircular extends StatelessWidget {
  const _IconoCircular({required this.fondo, required this.icono, required this.color});

  final Color fondo;
  final IconData icono;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(color: fondo, shape: BoxShape.circle),
      child: Icon(icono, color: color, size: 38),
    );
  }
}
