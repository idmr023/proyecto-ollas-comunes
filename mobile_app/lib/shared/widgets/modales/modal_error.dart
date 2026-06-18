import 'package:flutter/material.dart';
import '../../../core/constantes/constantes_app.dart';
import '../../../core/tema/colores_app.dart';

/// Modal de error reutilizable. Ofrece reintentar o cancelar la acción.
class ModalError extends StatelessWidget {
  const ModalError({
    super.key,
    this.titulo = 'Algo salió mal',
    required this.mensaje,
    this.textoReintentar = 'Reintentar',
  });

  final String titulo;
  final String mensaje;
  final String textoReintentar;

  /// Muestra el modal y devuelve `true` si el usuario eligió reintentar.
  static Future<bool> mostrar(
    BuildContext context, {
    String titulo = 'Algo salió mal',
    required String mensaje,
    String textoReintentar = 'Reintentar',
  }) async {
    final bool? reintentar = await showDialog<bool>(
      context: context,
      barrierColor: ColoresApp.verdeProfundo.withValues(alpha: 0.5),
      builder: (_) => ModalError(titulo: titulo, mensaje: mensaje, textoReintentar: textoReintentar),
    );
    return reintentar ?? false;
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
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(color: ColoresApp.criticoFondo, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, color: ColoresApp.criticoPunto, size: 36),
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
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(textoReintentar),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar', style: TextStyle(color: ColoresApp.textoTerciario)),
            ),
          ],
        ),
      ),
    );
  }
}
