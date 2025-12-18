import { Popover } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';

export default ({
	children,
	content,
	disabled = false,
	position = 'bottom center',
	width = 200,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef();

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el?.addEventListener('mouseenter', () => setIsOpen(true));
		el?.addEventListener('mouseleave', () => setIsOpen(false));
		return () => {
			el?.removeEventListener('mouseenter', () => setIsOpen(true));
			el?.removeEventListener('mouseleave', () => setIsOpen(false));
		};
	}, []);

	if (disabled) return <>{children}</>;

	return (
		<div ref={ref}>
			{children}
			{isOpen && (
				<Popover
					focusOnMount={false}
					className="tgwcfb-tooltip"
					position={position}
					onClose={() => setIsOpen(false)}
					onFocusOutside={() => setIsOpen(false)}
					noArrow={false}
				>
					<div style={{ minWidth: width }} className="tgwcfb-tooltip-content">
						{content}
					</div>
				</Popover>
			)}
		</div>
	);
};
