<div class="xoo-el-scgen-cont">

	<h3>Shortcode Generator</h3>

	<span style="font-size: 15px; margin-top: 15px; display: block;">To see the login modal, view your website as a guest or in incognito mode.</span>

	<div class="xoo-el-scgroup" data-attr="sctype">
		<label>Shortcode For: </label>
		<div>
			<label><input type="radio" data-fname="xoo-elscg-sctype" value="inline">Inline Form</label>
			<label><input type="radio" data-fname="xoo-elscg-sctype" value="popup">Open Popup</label>
		</div>	
	</div>


	<div class="xoo-elscg-shortcode">
		<div class="test"></div>
		<div>
			<div>Click<span class="xoo-elscg-copy dashicons dashicons-admin-page"></span>to copy the <b>SHORTCODE</b></div>
			<span class="xoo-elsc-updated-notice">Shortcode updated.</span>
		</div>
		<span class="xoo-elscg-copy dashicons dashicons-admin-page"></span>
		<textarea class="xoo-elscg-sctext" disabled></textarea>
		<span class="xoo-elscg-copy dashicons dashicons-admin-page"></span>
	</div>


	<div class="xoo-elscg-fields" data-type="inline">

		<span class="xoo-elsch-head">Below are the settings to adjust the shortcode</span>

		<div class="xoo-el-scgroup" data-attr="forms" data-multiple="yes">
			<label>Forms</label>
			<div>
				<label><input type="checkbox" data-fname="xoo-elscg-forms[]" value="login" checked>Login</label>
				<label><input type="checkbox" data-fname="xoo-elscg-forms[]" value="register" checked>Register</label>
			</div>
		</div>

		<div class="xoo-el-scgroup" data-attr="active">
			<label>Open Default Form</label>
			<div>
				<select data-fname="xoo-elscg-formdefault">
					<option value="login">Login</option>
					<option value="register">Register</option>
					<option value="lostpw">Lost Password</option>
				</select>
			</div>		
		</div>


		<div class="xoo-el-scgroup" data-attr="pattern">
			<label>Form Pattern</label>
			<div>
				<select data-fname="xoo-elscg-formpattern">
					<option value="separate">Separate Forms</option>
					<option value="single">Single Field Form</option>
				</select>	
				<span class="xoo-el-scgdesc">Single pattern only shows one email field and then further navgiates to login/register form.</span>
			</div>	
		</div>


		<div class="xoo-el-scgroup" data-attr="navstyle">
			<label>Navigation Style</label>
			<div>
				<select data-fname="xoo-elscg-navstyle">
					<option value="tabs">Tabs</option>
					<option value="links">Bottom Links</option>
					<option value="disable">Disable</option>
				</select>	
				<span class="xoo-el-scgdesc">Choose a way to switch between login and registration form.</span>
			</div>	
		</div>

		<div class="xoo-el-scgroup xoo-el-scredirects" data-attr="login_redirect">

			<label>Login Redirect</label>

			<div>

				<select data-fname="xoo-elscg-loginred">
					<option value="global">Global Setting</option>
					<option value="same">Same Page</option>
					<option value="custom">Custom URL</option>
				</select>	

				<input type="text" data-fname="xoo-elscg-loginred" value="<?php echo get_site_url() ?>" data-showval="custom">

				<span class="xoo-el-scgdesc">Redirect link after login.<br>
					Global Setting refers to the option set under general -> redirect settings.
				</span>
			</div>	

		</div>


		<div class="xoo-el-scgroup xoo-el-scredirects" data-attr="register_redirect">

			<label>Register Redirect</label>

			<div>

				<select data-fname="xoo-elscg-regred">
					<option value="global">Global Setting</option>
					<option value="same">Same Page</option>
					<option value="custom">Custom URL</option>
				</select>	

				<input type="text" data-fname="xoo-elscg-regred" value="<?php echo get_site_url() ?>" data-showval="custom">

				<span class="xoo-el-scgdesc">Redirect link after register.<br>
					Global Setting refers to the option set under general -> redirect settings.
				</span>

			</div>	

		</div>


	</div>


	<div class="xoo-elscg-fields" data-type="popup">

		<span class="xoo-elsch-head">Below are the settings to adjust the shortcode</span>

		<div class="xoo-el-scgroup xoo-el-sc-haseditor" data-attr="text">
			<label>Text before login</label>
			<div>
				<?php wp_editor( '{pop}Login{/pop}', 'xoo-elscg-poptxt' ); ?>
				<div class="xoo-el-scplhold">
					<span>Placeholders</span>
					<ul>
						<li>
							<label>{pop} {/pop}</label>
							<span>The content between {pop} and {/pop} will open the popup</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="xoo-el-scgroup" data-attr="type">
			<label>Pop Default Form</label>
			<div>
				<select data-fname="xoo-elscg-poptype">
					<option value="login">Login</option>
					<option value="register">Register</option>
					<option value="lost-password">Lost Password</option>
				</select>

				<span class="xoo-el-scgdesc" style="display: none; color: red;">This will be ineffective as "Single Field Form" is selected under "General" tab. Change it to "Separate forms" for this to work.</span>

			</div>	
		</div>

		<div class="xoo-el-scgroup xoo-el-scredirects" data-attr="redirect_to">
			<label>Redirect to</label>
			<div>
				<select data-fname="xoo-elscg-popred">
					<option value="global">Global Setting</option>
					<option value="same">Same Page</option>
					<option value="custom">Custom URL</option>
				</select>	
				<input type="text" data-fname="xoo-elscg-popred" value="<?php echo get_site_url() ?>" data-showval="custom">
				<span class="xoo-el-scgdesc">Redirect link after login/register.<br>
					Global Setting refers to the option set under general -> redirect settings.
				</span>
			</div>	
		</div>


		<div class="xoo-el-scgroup xoo-el-sc-haseditor" data-attr="change_to_text">

			<label>After signing in, change text to</label>

			<div>

				<?php wp_editor( '{logout}Logout?{/logout} {firstname}', 'xoo-elscg-pop-logout-txt' ); ?>

				<div class="xoo-el-scplhold">

					<span>Placeholders</span>

					<ul>
						<li>
							<label>{logout} {/logout}</label>
							<span>The text between {logout} and {/logout} will trigger the logout</span>
						</li>

						<li>
							<label>{firstname}</label>
							<span>User's firstname</span>
						</li>

						<li>
							<label>{lastname}</label>
							<span>User's lastname</span>
						</li>

						<li>
							<label>{username}</label>
							<span>User's username</span>
						</li>
					</ul>

				</div>
				
			</div>	

		</div>

		<span class="xoo-el-scpop-info">Apart from using a shortcode, there are other ways to open the popup.. Please check "info" tab.</span>

	</div>

</div>