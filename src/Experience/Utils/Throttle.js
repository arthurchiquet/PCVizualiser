export function throttle(func, delay = 250) {
    let lastCall = 0
    return (...args) => {
        const now = performance.now()
        if (now - lastCall >= delay) {
            func(...args)
            lastCall = now
        }
    }
}
