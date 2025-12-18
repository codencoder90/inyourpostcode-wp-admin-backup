/**
 * External dependencies
 */
import flatpickr from 'flatpickr';
import {
	addMonths,
	addYears,
	addWeeks,
	addDays,
	isSameDay,
	isBefore,
	isAfter,
	formatISO,
	startOfToday,
	endOfToday,
	isToday,
} from 'date-fns';

const datePicker = () => {
	function init() {
		const locale =
			! wpoSettings?.locale || wpoSettings.locale === 'en'
				? flatpickr?.l10ns?.default
				: flatpickr?.l10ns?.[ wpoSettings.locale ];

		flatpickr.localize( locale );

		Array.from( document.querySelectorAll( '.wpo-field-datepicker .wpo-datepicker-container' ) ).forEach(
			( container ) => {
				const input = container.querySelector( 'input' );
				const minDate = input.dataset?.minDate ?? null;
				const maxDate = input.dataset?.maxDate ?? null;
				const enableTime = input.dataset?.enableTime === '1' ?? false;
				const minTime = input.dataset?.minTime ?? '00:00';
				const maxTime = input.dataset?.maxTime ?? '23:59';
				const minuteIncrement = input.dataset?.minuteIncrement ?? 15;
				const hourIncrement = input.dataset?.hourIncrement ?? 1;
				const dateFormat = input.dataset?.dateFormat ?? 'F j, Y';
				const disableDays = input.dataset?.disableDays ?? null;
				const disableDates = input.dataset?.disableDates ?? null;
				const disableToday = input.dataset?.disableToday ?? false;
				const disablePast = input.dataset?.disablePastDates ?? false;
				const disableFuture = input.dataset?.disableFutureDates ?? false;

				new flatpickr( container, {
					static: true,
					wrap: true,
					dateFormat: enableTime ? 'Y-m-d H:i' : 'Y-m-d',
					altFormat: dateFormat,
					altInput: true,
					altInputClass: 'wpo-datepicker-alt-input',
					time_24hr: true,
					minuteIncrement,
					hourIncrement,
					minTime,
					maxTime,
					position: 'above',
					positionElement: container,
					disable: [
						( date ) =>
							disableHandler(
								date,
								disableDates,
								disableDays,
								disableToday,
								disablePast,
								disableFuture,
								minDate,
								maxDate
							),
					],
					enableTime,
					firstDayOfWeek: parseInt( wpoSettings?.start_of_week ?? 0 ) + 2,
					onOpen: [
						( selectedDates, dateString, instance ) => {
							instance.calendarContainer?.scrollIntoView( { behavior: 'smooth', block: 'center' } );
						},
					],
				} );
			}
		);
	}

	/**
	 * Disable dates based on the settings.
	 *
	 * @param {Date}    date
	 * @param {string}  disableDates
	 * @param {Array}   disableDays
	 * @param {boolean} disableToday
	 * @param {boolean} disablePast
	 * @param {boolean} disableFuture
	 * @param {string}  minDate
	 * @param {string}  maxDate
	 * @return {boolean} true if date is disabled
	 */
	function disableHandler(
		date,
		disableDates,
		disableDays,
		disableToday,
		disablePast,
		disableFuture,
		minDate,
		maxDate
	) {
		// check if today is disabled
		if ( disableToday && isToday( date ) ) {
			return true;
		}

		// check if past dates are disabled
		if ( disablePast && isBefore( date, startOfToday() ) ) {
			return true;
		}

		// check if future dates are disabled
		if ( disableFuture && isAfter( date, endOfToday() ) ) {
			return true;
		}

		// check minDate, can also be a dynamic value e.g +112d, -22w, +3m, -4y
		if ( minDate ) {
			const minDateDate =
				minDate.charAt( 0 ) === '+' || minDate.charAt( 0 ) === '-'
					? parseDynamicDateString( minDate )
					: new Date( minDate );

			if ( isBefore( date, minDateDate ) ) {
				return true;
			}
		}

		// check maxDate, can also be a dynamic value e.g +112d, -22w, +3m, -4y
		if ( maxDate ) {
			const maxDateDate =
				maxDate.charAt( 0 ) === '+' || maxDate.charAt( 0 ) === '-'
					? parseDynamicDateString( maxDate )
					: new Date( maxDate );

			if ( isAfter( date, maxDateDate ) ) {
				return true;
			}
		}

		// disable specific dates
		if ( disableDates ) {
			const ISODate = formatISO( date, { representation: 'date' } );
			const disableDatesArray = disableDates.split( ',' ).map( ( date ) => date.trim() );

			// Handle any static dates
			const staticDates = disableDatesArray.filter( ( staticDate ) => ! isDynamicDate( staticDate ) );

			if ( staticDates.includes( ISODate ) ) {
				return true;
			}

			// Handle any dynamic dates
			const dynamicDates = disableDatesArray.filter( ( dynamicDate ) => isDynamicDate( dynamicDate ) );

			const isDynamicMatch = dynamicDates.some( ( dynamicDateString ) => {
				const dynamicDate = parseDynamicDateString( dynamicDateString );

				if ( isSameDay( date, dynamicDate ) ) {
					return true;
				}

				return false;
			} );

			if ( isDynamicMatch ) {
				return true;
			}
		}

		if ( disableDays && disableDays.includes( date.getDay() ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Check if string is a dynamic date string.
	 *.e.g +112d, -22w, +3m, -4y
	 *
	 * @param {string} dateString
	 * @return {boolean} true if dynamic date
	 */
	function isDynamicDate( dateString ) {
		return dateString.charAt( 0 ) === '+' || dateString.charAt( 0 ) === '-';
	}

	/**
	 * Parse a dynamic date string and return a date object.
	 * e.g +112d, -22w, +3m, -4y
	 *
	 * @param {string} dynamicDateString
	 * @return {Date|null} date
	 */
	function parseDynamicDateString( dynamicDateString ) {
		const dynamicDateType = dynamicDateString.charAt( 0 );
		const dynamicDateValue = parseInt( dynamicDateString.substring( 1, dynamicDateString.length - 1 ) );
		const dynamicDateUnit = dynamicDateString.charAt( dynamicDateString.length - 1 );

		const now = new Date();

		let dynamicDate = null;

		switch ( dynamicDateUnit ) {
			case 'd':
				dynamicDate =
					dynamicDateType === '+' ? addDays( now, dynamicDateValue ) : addDays( now, -dynamicDateValue );
				break;
			case 'w':
				dynamicDate =
					dynamicDateType === '+' ? addWeeks( now, dynamicDateValue ) : addWeeks( now, -dynamicDateValue );
				break;
			case 'm':
				dynamicDate =
					dynamicDateType === '+' ? addMonths( now, dynamicDateValue ) : addMonths( now, -dynamicDateValue );
				break;
			case 'y':
				dynamicDate =
					dynamicDateType === '+' ? addYears( now, dynamicDateValue ) : addYears( now, -dynamicDateValue );
				break;
			default:
				break;
		}

		return dynamicDate;
	}

	return { init };
};

export default datePicker();
