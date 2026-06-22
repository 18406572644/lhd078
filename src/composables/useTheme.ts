import type { GlobalThemeOverrides } from 'naive-ui'
import { computed } from 'vue'

export function useTheme() {
  const themeOverride = computed<GlobalThemeOverrides>(() => ({
    common: {
      primaryColor: '#E8763A',
      primaryColorHover: '#D56A2F',
      primaryColorPressed: '#C05E25',
      primaryColorSuppl: '#E8763A',
      textColorBase: '#5C3D2E',
      bodyColor: '#FDF6EC',
      cardColor: '#FFF3D6',
      modalColor: '#FFF3D6',
      popoverColor: '#FFF3D6',
      borderColor: '#B8956A',
      dividerColor: 'rgba(184,149,106,0.3)',
      inputColor: '#FFF8E8',
      actionColor: '#FFF3D6',
      tableColor: '#FFF8E8',
      hoverColor: 'rgba(232,118,58,0.06)',
      fontFamily: "'Noto Sans SC', sans-serif",
      fontFamilyMono: "'Noto Sans SC', sans-serif",
      borderRadius: '8px',
      borderRadiusSmall: '6px',
      successColor: '#7CB342',
      warningColor: '#E8763A',
      errorColor: '#D32F2F',
      infoColor: '#B8956A',
    },
    Button: {
      borderRadiusMedium: '8px',
      borderRadiusSmall: '6px',
      borderRadiusLarge: '10px',
      colorPrimary: '#E8763A',
      colorHoverPrimary: '#D56A2F',
      colorPressedPrimary: '#C05E25',
      textColorPrimary: '#FFFFFF',
      borderPrimary: '1px solid #E8763A',
      borderHoverPrimary: '1px solid #D56A2F',
      borderPressedPrimary: '1px solid #C05E25',
    },
    Card: {
      borderRadius: '12px',
      color: '#FFF3D6',
      borderColor: 'rgba(184,149,106,0.2)',
    },
    Input: {
      borderRadius: '8px',
      color: '#FFF8E8',
      borderColor: '#B8956A',
      borderHover: '#E8763A',
      borderFocus: '#E8763A',
    },
    Tag: {
      borderRadius: '6px',
    },
    Tabs: {
      tabTextColorActiveLine: '#E8763A',
      tabTextColorHoverLine: '#D56A2F',
      barColor: '#E8763A',
    },
    Menu: {
      itemTextColorActive: '#E8763A',
      itemTextColorActiveHover: '#D56A2F',
      itemIconColorActive: '#E8763A',
      itemColorActive: 'rgba(232,118,58,0.08)',
      itemColorHover: 'rgba(232,118,58,0.06)',
    },
    DataTable: {
      borderRadius: '12px',
      thColor: '#FFF3D6',
      tdColor: '#FFF8E8',
    },
    Modal: {
      borderRadius: '12px',
      color: '#FFF3D6',
    },
    Upload: {
      borderRadius: '8px',
    },
  }))

  return { themeOverride }
}
