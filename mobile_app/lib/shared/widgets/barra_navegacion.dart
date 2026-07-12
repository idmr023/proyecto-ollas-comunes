import 'package:flutter/material.dart';
import '../../core/tema/colores_app.dart';

/// Una pestaña de la barra de navegación inferior.
class ItemNavegacion {
  const ItemNavegacion({required this.icono, required this.etiqueta});

  final IconData icono;
  final String etiqueta;
}

/// Barra de navegación inferior de la app (Inicio, Inventario, Padrón, Más),
/// fiel al mockup: fondo claro translúcido y resaltado terracota del activo.
class BarraNavegacion extends StatelessWidget {
  const BarraNavegacion({
    super.key,
    required this.indiceActivo,
    required this.onCambio,
    required this.items,
  });

  final int indiceActivo;
  final ValueChanged<int> onCambio;
  final List<ItemNavegacion> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: ColoresApp.superficie,
        border: Border(top: BorderSide(color: Color(0xFFECE6DC))),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: List<Widget>.generate(items.length, (int i) {
              final bool activo = i == indiceActivo;
              final Color color = activo
                  ? ColoresApp.primario
                  : ColoresApp.textoPlaceholder;
              return Expanded(
                child: InkWell(
                  onTap: () => onCambio(i),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: <Widget>[
                      Icon(items[i].icono, color: color, size: 24),
                      const SizedBox(height: 4),
                      Text(
                        items[i].etiqueta,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
