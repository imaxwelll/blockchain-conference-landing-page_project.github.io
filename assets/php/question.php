<header class="b-section_header b-section_header__stroked">
    <h2><i class="i-icon i-ion-help-buoy m-colorized"></i>Задайте нам <span class="m-colorized">питання</span></h2>
    <p>Ми відповімо Вам найближчим часом</p>
</header>

<div class="b-form">
    <form action="assets/php/form.php" method="post" data-checkup="true" data-xhr="true">

        <div class="b-form_box">

            <div class="b-form_box_field">
                <input type="text" name="name" placeholder="Ваше ім'я" data-required />
            </div>

        </div>

        <div class="b-form_box">

            <div class="b-form_box_field">
                <input type="text" name="email" placeholder="Ваш email" data-required data-pattern="^[0-9a-z_.-]+@([a-z0-9_-]+\.)+[a-z]{2,}$" data-pattern-type="email" />
            </div>

        </div>

        <div class="b-form_box">

            <div class="b-form_box_field">
                <textarea name="msg" placeholder="Ваше питання" data-required></textarea>
            </div>

        </div>

        <div class="b-signUp_form_bottom b-form_bottom b-form_bottom__center">

            <input type="hidden" name="subject" value="Question" />
            <button type="submit" class="e-btn e-btn_outline e-btn_lg e-btn_smooth" data-label="Надіслати"><span>Надіслати</span></button>

        </div>

    </form>
</div>

