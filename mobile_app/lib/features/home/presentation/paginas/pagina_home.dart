import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/logo_olla.dart';

/// Placeholder temporal de la aplicación autenticada. Se reemplazará por el
/// shell con bottom nav (Dashboard, Inventario, Padrón, Más) en fases siguientes.
@RoutePage(name: 'HomeRoute')
class PaginaHome extends StatelessWidget {
  const PaginaHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const LogoOlla(tamano: 80, radio: 24),
            const SizedBox(height: 20),
            Text('Cimientos listos', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            const Text(
              'Las pantallas de la app se construyen\nen las siguientes fases.',
              textAlign: TextAlign.center,
              style: TextStyle(color: ColoresApp.textoTenue, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
