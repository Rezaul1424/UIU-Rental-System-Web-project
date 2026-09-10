import ListingDetailPage from '../../../components/ListingDetail'
import type { Listing } from '../../../types'

type ListingDetailViewPageProps = {
  listing: Listing
  onBack: () => void
  isFavorited: boolean
  onToggleFavorite: () => void
  actions: React.ReactNode
}

export default function ListingDetailViewPage({ listing, onBack, isFavorited, onToggleFavorite, actions }: ListingDetailViewPageProps) {
  return (
    <ListingDetailPage
      listing={listing}
      onBack={onBack}
      backLabel="← Back to Browse"
      isFavorited={isFavorited}
      onToggleFavorite={onToggleFavorite}
      actions={actions}
    />
  )
}
