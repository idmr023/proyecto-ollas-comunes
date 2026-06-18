import 'package:flutter/material.dart';
import '../../../core/tema/colores_app.dart';

/// Vista de estado de error reutilizable (igual que el mockup): ícono, título,
/// mensaje y botón de reintento.
class VistaError extends StatelessWidget {
  const VistaError({
    super.key,
    this.titulo = 'No se pudo cargar',
    required this.mensaje,
    required this.onReintentar,
  });

  final String titulo;
  final String mensaje;
  final VoidCallback onReintentar;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(color: ColoresApp.criticoFondo, borderRadius: BorderRadius.circular(26)),
              child: const Icon(Icons.warning_amber_rounded, color: ColoresApp.criticoPunto, size: 42),
            ),
            const SizedBox(height: 20),
            Text(titulo, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: ColoresApp.textoTenue, height: 1.5),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: onReintentar,
              style: FilledButton.styleFrom(minimumSize: const Size(0, 50)),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Text('Reintentar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
