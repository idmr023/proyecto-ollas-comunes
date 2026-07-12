import 'package:flutter/material.dart';
import '../../../core/tema/colores_app.dart';

/// Vista de estado vacío reutilizable: ícono suave, título, mensaje y una
/// acción opcional (igual que el mockup).
class VistaVacia extends StatelessWidget {
  const VistaVacia({
    super.key,
    required this.icono,
    required this.titulo,
    required this.mensaje,
    this.textoAccion,
    this.onAccion,
  });

  final IconData icono;
  final String titulo;
  final String mensaje;
  final String? textoAccion;
  final VoidCallback? onAccion;

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
              decoration: BoxDecoration(
                color: const Color(0xFFF0ECE3),
                borderRadius: BorderRadius.circular(26),
              ),
              child: Icon(icono, color: const Color(0xFFB6AE9F), size: 42),
            ),
            const SizedBox(height: 20),
            Text(titulo, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: ColoresApp.textoTenue,
                height: 1.5,
              ),
            ),
            if (textoAccion != null && onAccion != null) ...<Widget>[
              const SizedBox(height: 22),
              FilledButton(
                onPressed: onAccion,
                style: FilledButton.styleFrom(minimumSize: const Size(0, 50)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(textoAccion!),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
