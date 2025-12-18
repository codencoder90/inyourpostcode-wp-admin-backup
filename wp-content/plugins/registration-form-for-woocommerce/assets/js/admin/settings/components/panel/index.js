import { Button, Icon } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import $ from 'jquery';

import { Tooltip } from '../index';

export default ({ children, title, help = null }) => {
	const [open, setOpen] = useState(false);
	const contentElRef = useRef();

	return (
		<div className={`tgwcfb-panel${open ? ' is-opened' : ''}`}>
			<Button
				onClick={() => {
					setOpen(!open);
					if (!open) {
						$(contentElRef.current).slideDown(500);
					} else {
						$(contentElRef.current).slideUp(500);
					}
				}}
				icon={open ? 'minus' : 'plus-alt2'}
			>
				<span
					style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
				>
					{title}
					{help && (
						<Tooltip content={help} position="top center">
							<Icon icon="info-outline" />
						</Tooltip>
					)}
				</span>
			</Button>
			<div
				className="tgwcfb-panel-content"
				style={{ display: 'none' }}
				ref={contentElRef}
			>
				<div className="tgwcfb-panel-content-inner">{children}</div>
			</div>
		</div>
	);
};
