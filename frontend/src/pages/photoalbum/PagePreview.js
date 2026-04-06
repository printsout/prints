import { ImageSlot } from './ImageSlot';

export function PagePreview({ page, pageIndex, onUpload, onRemove, onCaptionChange }) {
  const { layout, images, captions } = page;
  const slot = (idx) => (
    <ImageSlot
      key={idx}
      image={images[idx] || null}
      slotIndex={idx}
      pageIndex={pageIndex}
      onUpload={onUpload}
      onRemove={onRemove}
      caption={captions?.[idx] || ''}
      onCaptionChange={onCaptionChange}
    />
  );

  const containerClass = "w-full h-full";

  switch (layout) {
    case 'two-h':
      return <div className={`${containerClass} grid grid-cols-2 gap-1 p-1`}>{slot(0)}{slot(1)}</div>;
    case 'two-v':
      return <div className={`${containerClass} grid grid-rows-2 gap-1 p-1`}>{slot(0)}{slot(1)}</div>;
    case 'three':
      return (
        <div className={`${containerClass} grid grid-rows-2 gap-1 p-1`}>
          <div className="row-span-1">{slot(0)}</div>
          <div className="grid grid-cols-2 gap-1">{slot(1)}{slot(2)}</div>
        </div>
      );
    case 'four':
      return <div className={`${containerClass} grid grid-cols-2 grid-rows-2 gap-1 p-1`}>{slot(0)}{slot(1)}{slot(2)}{slot(3)}</div>;
    default:
      return <div className={`${containerClass} p-1`}>{slot(0)}</div>;
  }
}
