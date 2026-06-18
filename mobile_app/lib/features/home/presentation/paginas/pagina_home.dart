import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/barra_navegacion.dart';
import '../../../dashboard/presentation/paginas/pagina_dashboard.dart';
import '../../../inventario/presentation/paginas/pagina_inventario.dart';
import '../widgets/pestana_proximamente.dart';

/// Shell principal de la app autenticada: aloja la barra de navegación inferior
/// y las pestañas (Inicio, Inventario, Padrón, Más).
@RoutePage(name: 'HomeRoute')
class PaginaHome extends StatefulWidget {
  const PaginaHome({super.key});

  @override
  State<PaginaHome> createState() => _PaginaHomeState();
}

class _PaginaHomeState extends State<PaginaHome> {
  int _indice = 0;

  static const List<ItemNavegacion> _items = <ItemNavegacion>[
    ItemNavegacion(icono: Icons.home_outlined, etiqueta: 'Inicio'),
    ItemNavegacion(icono: Icons.inventory_2_outlined, etiqueta: 'Inventario'),
    ItemNavegacion(icono: Icons.groups_outlined, etiqueta: 'Padrón'),
    ItemNavegacion(icono: Icons.more_horiz_rounded, etiqueta: 'Más'),
  ];

  void _irA(int indice) => setState(() => _indice = indice);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: IndexedStack(
        index: _indice,
        children: <Widget>[
          PaginaDashboard(onIrInventario: () => _irA(1), onIrPadron: () => _irA(2)),
          const PaginaInventario(),
          const PestanaProximamente(titulo: 'Padrón'),
          const PestanaProximamente(titulo: 'Más opciones'),
        ],
      ),
      bottomNavigationBar: BarraNavegacion(indiceActivo: _indice, onCambio: _irA, items: _items),
    );
  }
}
