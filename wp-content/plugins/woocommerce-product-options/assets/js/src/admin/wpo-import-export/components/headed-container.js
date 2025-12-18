import Icon from '../icons';
import WCTableTooltip from '../../wpo-settings-page/components/wc-table-tooltip';

const HeadedContainer = ( props ) => {
	return (
		<div className="wpo-headed-container">
			<div className="wpo-headed-container__header">
				<Icon id={ props.icon } />
				<h2>{ props.title }</h2>
				{ props.tooltip?.length > 0 && <WCTableTooltip tooltip={ props.tooltip } /> }
			</div>
			<div className="wpo-headed-container__content">{ props.children }</div>
		</div>
	);
};

export default HeadedContainer;
