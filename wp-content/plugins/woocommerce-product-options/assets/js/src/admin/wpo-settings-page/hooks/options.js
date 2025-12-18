/**
 * Wordpress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useMultipleAdminNotifications } from '@barn2plugins/react-helpers';

async function getOptions( { queryKey } ) {
	if ( ! queryKey?.[ 1 ] ) {
		return [];
	}
	const options = await apiFetch( {
		path: `/wc-product-options/v1/${ queryKey[ 0 ] }/all/${ queryKey[ 1 ] }`,
	} );

	return options.map( ( option ) => ( { ...option, choices: option.choices || option?.settings?.manual_products } ) );
}

export function useGroupOptions( groupID ) {
	return useQuery( [ 'options', groupID ], getOptions, {
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	} );
}

export function useCreateOption() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/options',
				method: 'POST',
				data,
			} ),
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( data ) => {
				await queryClient.cancelQueries( 'options' );

				const previousValue = queryClient.getQueryData( 'options' );

				queryClient.setQueryData( 'options', ( old ) => {
					old.pop();
					return [ ...old, data ];
				} );

				return previousValue;
			},
			onSuccess: () => {
				setNotification( 'success', __( 'Option successfully created', 'woocommerce-product-options' ) );
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification( 'error', error.message );
				queryClient.setQueryData( 'options', previousValue );
			},
			// After success or failure, refetch the options query
			onSettled: () => {
				queryClient.invalidateQueries( 'options' );
			},
		}
	);
}

export function useUpdateOption() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( data ) =>
			apiFetch( {
				path: '/wc-product-options/v1/options',
				method: 'PUT',
				data,
			} ),
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( data ) => {
				await queryClient.cancelQueries( 'options' );

				const previousValue = queryClient.getQueryData( 'options' );

				queryClient.setQueryData( 'options', ( old ) => {
					old[ old.findIndex( ( option ) => option.id === data.id ) ] = data;

					return old;
				} );

				return previousValue;
			},
			onSuccess: () => {
				setNotification( 'success', __( 'Option successfully updated', 'woocommerce-product-options' ) );
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification( 'error', error.message );
				queryClient.setQueryData( 'options', previousValue );
			},
			// After success or failure, refetch the options query
			onSettled: () => {
				queryClient.invalidateQueries( 'options' );
			},
		}
	);
}

export function useDeleteOption() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();

	return useMutation(
		( optionID ) =>
			optionID === 0
				? optionID
				: apiFetch( {
						path: '/wc-product-options/v1/options',
						method: 'DELETE',
						data: {
							id: optionID,
						},
				  } ),
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( optionID ) => {
				await queryClient.cancelQueries( 'options' );

				const previousValue = queryClient.getQueryData( 'options' );
				queryClient.setQueryData( 'options', ( old ) => {
					const optimistic = old.filter( ( group ) => group.id !== optionID );

					return optimistic;
				} );

				return previousValue;
			},
			onSuccess: () => {
				setNotification( 'success', __( 'Option successfully deleted', 'woocommerce-product-options' ) );
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification( 'error', error.message );
				queryClient.setQueryData( 'options', previousValue );
			},
			// After success or failure, refetch the options query
			onSettled: () => {
				queryClient.invalidateQueries( 'options' );
			},
		}
	);
}

export function useReOrderOption() {
	const queryClient = useQueryClient();
	const { setNotification } = useMultipleAdminNotifications();
	return useMutation(
		( reOrderedGroups ) => {
			const reOrderedIds = reOrderedGroups.map( ( option ) => option.id );

			return apiFetch( {
				path: '/wc-product-options/v1/options/reorder',
				method: 'PUT',
				data: {
					reorder: reOrderedIds,
				},
			} );
		},
		{
			// Optimistically update the cache value on mutate, but store
			// the old value and return it so that it's accessible in case of
			// an error
			onMutate: async ( reOrderedOptions ) => {
				await queryClient.cancelQueries( 'options' );

				const previousValue = queryClient.getQueryData( 'options' );

				queryClient.setQueryData( 'options', reOrderedOptions );

				return previousValue;
			},
			onSuccess: () => {
				setNotification( 'success', __( 'Options successfully reordered', 'woocommerce-product-options' ) );
			},
			// On failure, roll back to the previous value
			onError: ( error, variables, previousValue ) => {
				setNotification( 'error', error.message );
				queryClient.setQueryData( 'options', previousValue );
			},
			// After success or failure, refetch the options query
			onSettled: () => {
				queryClient.invalidateQueries( 'options' );
			},
		}
	);
}

/**
 * Get product attributes, selected attribute, and set selected attribute
 *
 * @param {string} attributeId
 */
export function useProductAttributes( attributeId ) {
	const [ attributes, setAttributes ] = useState( [] );
	const [ selectedAttribute, setSelectedAttribute ] = useState( [] );

	useEffect( () => {
		const mappedAttributes = Object.entries( window?.wpoExternalConditions?.productAttributes?.options ?? {} ).map(
			( [ id, attribute ] ) => ( {
				id: attribute.id,
				name: attribute.name,
				key: attribute.id,
				terms: attribute.choices,
			} )
		);

		setAttributes( mappedAttributes );

		const savedAttribute = mappedAttributes.filter( ( attribute ) => attribute.id === attributeId ) ?? [];

		setSelectedAttribute( savedAttribute );
	}, [ attributeId ] );

	return {
		attributes,
		selectedAttribute,
		setSelectedAttribute,
	};
}
