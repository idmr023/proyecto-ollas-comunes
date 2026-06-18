import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';

/// Placeholder de una pestaña que se construirá en una fase posterior.
class PestanaProximamente extends StatelessWidget {
  const PestanaProximamente({super.key, required this.titulo});

  final String titulo;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(color: ColoresApp.superficieAlterna, borderRadius: BorderRadius.circular(24)),
              child: const Icon(Icons.construction_outlined, color: ColoresApp.textoTenue, size: 38),
            ),
            const SizedBox(height: 18),
            Text(titulo, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            const Text(
              'Disponible muy pronto.',
              style: TextStyle(color: ColoresApp.textoTenue),
            ),
          ],
        ),
      ),
    );
  }
}
