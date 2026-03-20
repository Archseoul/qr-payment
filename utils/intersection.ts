export function intersection () {
  const inView = ref(Array(...Array(50)).map(_ => false))

  const onIntersection = (entry: any) => {
    const index = parseInt(entry.target.dataset.id, 10)
    setTimeout(() => {
      inView.value.splice(index, 1, entry.isIntersecting)
    }, 50)
  }

  return {
    inView,
    onIntersection
  }
}
