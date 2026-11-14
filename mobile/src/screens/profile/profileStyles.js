import { StyleSheet } from 'react-native';

// Estilos da tela de Perfil (separados do ProfileScreen.js, que passava de
// 2.000 linhas). As cores vêm do tema (appColors) inline em cada componente.
export default StyleSheet.create({
    stage: {
      flex: 1,
    },

    content: {
      width: '100%',
      maxWidth: 430,

      alignSelf: 'center',

      paddingHorizontal: 16,
    },

    profileCard: {
      minHeight: 104,

      marginTop: 16,

      paddingHorizontal: 14,
      paddingVertical: 14,

      borderRadius: 20,
      borderWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',
    },

    avatarButton: {
      width: 72,
      height: 72,

      borderRadius: 36,

      alignItems: 'center',
      justifyContent: 'center',

      position: 'relative',
    },

    profilePhoto: {
      width: 72,
      height: 72,

      borderRadius: 36,
    },

    initials: {
      color: '#FFFFFF',

      fontSize: 22,
      fontWeight: '900',
    },

    cameraBadge: {
      position: 'absolute',

      right: -2,
      bottom: -2,

      width: 27,
      height: 27,

      borderRadius: 14,

      borderWidth: 2,

      alignItems: 'center',
      justifyContent: 'center',
    },

    profileCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 14,
    },

    profileName: {
      fontSize: 18,
      lineHeight: 23,

      fontWeight: '800',
    },

    profileRole: {
      marginTop: 3,

      fontSize: 12,
      fontWeight: '700',
    },

    profileHint: {
      marginTop: 5,

      fontSize: 11,
      lineHeight: 15,

      fontWeight: '500',
    },

    editButton: {
      width: 36,
      height: 36,

      marginLeft: 8,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',
    },

    themeCard: {
      minHeight: 68,

      marginTop: 12,

      paddingHorizontal: 14,
      paddingVertical: 10,

      borderRadius: 18,
      borderWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',
    },

    mainIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',
      justifyContent: 'center',
    },

    themeCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 11,
      marginRight: 10,
    },

    switchTrack: {
      width: 48,
      height: 28,

      padding: 3,

      borderRadius: 14,

      justifyContent: 'center',
    },

    switchKnob: {
      width: 22,
      height: 22,

      borderRadius: 11,

      backgroundColor:
        '#FFFFFF',
    },

    switchKnobActive: {
      alignSelf: 'flex-end',
    },

    section: {
      marginTop: 20,
    },

    sectionTitle: {
      marginBottom: 9,

      fontSize: 16,
      fontWeight: '800',
    },

    sectionCard: {
      overflow: 'hidden',

      borderRadius: 18,
      borderWidth: 1,
    },

    row: {
      minHeight: 64,

      paddingHorizontal: 14,
      paddingVertical: 10,

      flexDirection: 'row',
      alignItems: 'center',
    },

    rowPressed: {
      opacity: 0.72,
    },

    rowIcon: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: 'center',
      justifyContent: 'center',
    },

    rowCopy: {
      flex: 1,
      minWidth: 0,

      marginLeft: 11,
      marginRight: 7,
    },

    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
    },

    itemSubtitle: {
      marginTop: 3,

      fontSize: 11.5,
      lineHeight: 16,

      fontWeight: '500',
    },

    logoutButton: {
      height: 54,

      marginTop: 22,
      marginBottom: 10,

      borderRadius: 16,
      borderWidth: 1,

      flexDirection: 'row',

      alignItems: 'center',
      justifyContent: 'center',

      gap: 8,
    },

    logoutText: {
      fontSize: 14,
      fontWeight: '800',
    },

    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.48)',

      justifyContent:
        'flex-end',

      paddingHorizontal: 14,
      paddingBottom: 16,
    },

    photoMenu: {
      width: '100%',
      maxWidth: 430,

      alignSelf: 'center',

      borderRadius: 24,
      borderWidth: 1,

      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
    },

    modalHandle: {
      width: 42,
      height: 4,

      borderRadius: 4,

      backgroundColor:
        '#C8C8CE',

      alignSelf: 'center',

      marginBottom: 16,
    },

    photoMenuTitle: {
      fontSize: 19,
      fontWeight: '800',
    },

    photoMenuSubtitle: {
      marginTop: 4,
      marginBottom: 12,

      fontSize: 12,
      lineHeight: 17,

      fontWeight: '500',
    },

    photoMenuItem: {
      minHeight: 66,

      borderBottomWidth: 1,

      flexDirection: 'row',
      alignItems: 'center',

      paddingVertical: 10,
    },

    photoMenuIcon: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems: 'center',
      justifyContent: 'center',
    },

    photoMenuCopy: {
      flex: 1,

      marginLeft: 12,
      marginRight: 8,
    },

    photoMenuItemTitle: {
      fontSize: 14,
      fontWeight: '700',
    },

    photoMenuItemSubtitle: {
      marginTop: 3,

      fontSize: 11.5,
      lineHeight: 16,

      fontWeight: '500',
    },

    cancelButton: {
      height: 48,

      marginTop: 14,

      borderRadius: 15,
      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelButtonText: {
      fontSize: 14,
      fontWeight: '700',
    },

    confirmOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.5)',

      alignItems: 'center',
      justifyContent: 'center',

      paddingHorizontal: 24,
    },

    confirmCard: {
      width: '100%',
      maxWidth: 380,

      borderRadius: 22,
      borderWidth: 1,

      padding: 20,

      alignItems: 'center',
    },

    confirmIcon: {
      width: 52,
      height: 52,

      borderRadius: 18,

      alignItems: 'center',
      justifyContent: 'center',

      marginBottom: 14,
    },

    confirmTitle: {
      fontSize: 19,
      fontWeight: '800',

      textAlign: 'center',
    },

    confirmText: {
      marginTop: 8,

      fontSize: 13,
      lineHeight: 19,

      textAlign: 'center',
    },

    confirmActions: {
      width: '100%',

      flexDirection: 'row',

      gap: 10,

      marginTop: 20,
    },

    confirmCancel: {
      flex: 1,

      height: 48,

      borderRadius: 15,
      borderWidth: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmCancelText: {
      fontSize: 14,
      fontWeight: '700',
    },

    confirmRemove: {
      flex: 1,

      height: 48,

      borderRadius: 15,

      alignItems: 'center',
      justifyContent: 'center',
    },

    confirmRemoveText: {
      color: '#FFFFFF',

      fontSize: 14,
      fontWeight: '800',
    },

    pressed: {
      opacity: 0.82,

      transform: [
        {
          scale: 0.98,
        },
      ],
    },
  });