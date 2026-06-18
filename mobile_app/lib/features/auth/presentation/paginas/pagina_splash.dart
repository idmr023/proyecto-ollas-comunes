import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/logo_olla.dart';

/// Pantalla de bienvenida (splash / onboarding) de SIGO-OLLAS.
@RoutePage(name: 'SplashRoute')
class PaginaSplash extends StatelessWidget {
  const PaginaSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.7),
            radius: 1.1,
            colors: <Color>[ColoresApp.verdeMedio, ColoresApp.verdeProfundo],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              children: <Widget>[
                const Spacer(),
                const LogoOlla(),
                const SizedBox(height: 26),
                Text(
                  'SIGO-OLLAS',
                  style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Gestión de ollas comunes\npara nuestra comunidad',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: ColoresApp.verdeClaro, fontSize: 15, fontWeight: FontWeight.w500, height: 1.4),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => _comenzar(context),
                    child: const Text('Comenzar'),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _comenzar(BuildContext context) {
    context.router.replace(const HomeRoute());
  }
}
