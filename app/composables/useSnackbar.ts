export const useSnackbar = () => {
    const show = useState('snackbar-show', () => false)
    const message = useState('snackbar-message', () => '')
    const type = useState('snackbar-type', () => 'success') // 'success' | 'error' | 'info'

    const open = (msg: string, msgType: 'success' | 'error' | 'info' = 'success') => {
        message.value = msg
        type.value = msgType
        show.value = true

        // Auto-close after 3 seconds
        setTimeout(() => {
            show.value = false
        }, 3000)
    }

    const close = () => {
        show.value = false
    }

    return {
        show,
        message,
        type,
        open,
        close
    }
}
